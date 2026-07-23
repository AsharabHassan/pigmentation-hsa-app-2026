import { once } from "node:events";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { openBrowser, RenderInternals } from "@remotion/renderer";

const CAPTURE_WIDTH = 432;
const CAPTURE_HEIGHT = 768;
const CAPTURE_FPS = 30;
const NAVIGATION_TIMEOUT_MS = 60_000;
const ANALYSIS_TIMEOUT_MS = 120_000;
const DEFAULT_URL = "http://127.0.0.1:3000/";
const DEMO_ASSET_PATH =
  "/assets/hsa-cinematic/source/pigmentation-model-pexels-24735911.jpg";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const defaultOutput = path.join(
  projectRoot,
  "public",
  "assets",
  "hsa-cinematic",
  "app-capture",
  "hsa-full-journey-v2.mp4",
);

const cli = parseArguments(process.argv.slice(2));
const targetUrl = makeCaptureUrl(
  cli.url ?? process.env.HSA_CAPTURE_URL ?? DEFAULT_URL,
);
const outputPath = path.resolve(cli.output ?? defaultOutput);
const targetOrigin = new URL(targetUrl).origin;
const demoAssetUrl = new URL(DEMO_ASSET_PATH, targetUrl).href;

let browser;
let page;
let cdp;
let screencastRunning = false;
let captureStartedAt = 0;
let captureStoppedAt = 0;
const capturedFrames = [];
const networkEvents = {
  analyze: [],
  blocked: [],
};
const milestones = [];

try {
  await assertDevServer(targetUrl);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  console.info(`[capture] Opening ${targetUrl}`);
  browser = await openBrowser("chrome", {
    chromeMode: "headless-shell",
    logLevel: "warn",
    forceDeviceScaleFactor: 1,
  });
  page = await browser.newPage({
    context: () => null,
    logLevel: "warn",
    indent: false,
    pageIndex: 0,
    onBrowserLog: null,
    onLog: ({ logLevel, previewString }) => {
      if (logLevel === "error") console.error(`[browser] ${previewString}`);
    },
  });
  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
  page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);
  await page.setViewport({
    width: CAPTURE_WIDTH,
    height: CAPTURE_HEIGHT,
    deviceScaleFactor: 1,
  });

  cdp = page._client();
  installNetworkObservers(cdp, targetOrigin, networkEvents);
  await enableNetworkGuard(cdp, targetOrigin);
  await installInPageSafetyGuard(page);

  await page.goto({
    url: targetUrl,
    timeout: NAVIGATION_TIMEOUT_MS,
  });
  await waitForText(page, "Begin your analysis", NAVIGATION_TIMEOUT_MS);
  await waitForHydratedControl(
    page,
    "button",
    "Begin your analysis",
    NAVIGATION_TIMEOUT_MS,
  );

  await startScreencast(cdp);
  screencastRunning = true;
  captureStartedAt = performance.now();
  await waitForFirstFrame(capturedFrames, 10_000);
  await hold(850);
  markMilestone("hero");
  await hold(450);

  console.info("[capture] Hero -> consent");
  await touchClickByText(page, "button", "Begin your analysis");
  await waitForText(page, "A quick photo to begin", 10_000);
  markMilestone("upload");
  await hold(700);

  console.info("[capture] Consent -> real upload");
  await touchClickByText(page, "label", "I consent", { exact: false });
  await waitForEnabledButton(page, "Upload photo", 5_000);
  await hold(450);
  await touchClickByText(page, "button", "Upload photo");
  await hold(300);
  await injectRealFile(page, demoAssetUrl);

  await waitForText(page, "Reading your features", 12_000);
  markMilestone("scan");
  console.info("[capture] Real MediaPipe scan + real /api/analyze");
  await waitForText(page, "Your guide is ready", ANALYSIS_TIMEOUT_MS, {
    failOnText: "Let's try a clearer photo",
  });
  markMilestone("lead-gate");
  await hold(900);

  console.info("[capture] Completing local-only demo lead gate");
  await typeFieldByLabel(page, "First name", "Demo");
  await typeFieldByLabel(page, "Last name", "Journey");
  await typeFieldByLabel(page, "Email", "capture@hsa.invalid");
  await typeFieldByLabel(page, "Phone", "07000 000000");
  await hold(350);
  await touchClickByText(page, "button", "Reveal my result");

  await waitForText(page, "Your pigmentation map", 20_000);
  await waitForText(page, "Download your report", 20_000);
  await waitForAnalyzeRequest(networkEvents, 5_000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
  await hold(1_000);
  markMilestone("report-summary");
  await hold(1_200);

  console.info("[capture] Report summary -> pigmentation map");
  await smoothScrollToText(page, "Your pigmentation map", {
    selector: "h3",
    durationMs: 1_150,
    offset: 86,
  });
  markMilestone("pigmentation-map");
  await hold(1_900);
  await touchFirstMapArea(page);
  await hold(1_300);

  console.info("[capture] Pigmentation map -> three-step protocol");
  await smoothScrollToText(page, "Your treatment", {
    selector: "h3",
    durationMs: 1_200,
    offset: 84,
  });
  markMilestone("protocol");
  await hold(2_500);

  console.info("[capture] Skipping gallery/testimonials -> consultation CTA");
  await hidePlaceholderSections(page);
  await jumpToBookingCta(page);
  markMilestone("booking-cta");
  await hold(2_300);

  captureStoppedAt = performance.now();
  await stopScreencast(cdp);
  screencastRunning = false;

  const inPageBlocks = await page.evaluate(() => {
    return Array.isArray(window.__hsaCaptureBlockedRequests)
      ? window.__hsaCaptureBlockedRequests
      : [];
  });
  const blockedPaths = new Set([
    ...networkEvents.blocked.map((item) => item.pathname),
    ...inPageBlocks.map((item) => item.pathname),
  ]);

  if (!networkEvents.analyze.length) {
    throw new Error(
      "The journey finished without observing the real /api/analyze request.",
    );
  }
  if (!blockedPaths.has("/api/lead")) {
    throw new Error(
      "Safety verification failed: the lead request was not intercepted.",
    );
  }

  const durationMs = captureStoppedAt - captureStartedAt;
  console.info(
    `[safety] Blocked ${[...blockedPaths].join(", ")} inside the capture browser.`,
  );
  console.info(
    `[capture] Encoding ${capturedFrames.length} timestamped browser frames (${(
      durationMs / 1_000
    ).toFixed(2)}s) at ${CAPTURE_FPS}fps`,
  );
  console.info("[capture] Visual milestones:");
  for (const milestone of milestones) {
    console.info(
      `  ${milestone.seconds.toFixed(3)}s  ${milestone.name}`,
    );
  }
  await encodeFrames({
    frames: capturedFrames,
    durationMs,
    captureStartedAt,
    outputPath,
  });

  console.info(`[capture] Wrote ${outputPath}`);
} catch (error) {
  if (page) {
    const state = await page
      .evaluate(() => ({
        url: window.location.href,
        text: (document.body?.innerText ?? "").slice(0, 1_200),
      }))
      .catch(() => null);
    if (state) {
      console.error(`[capture] Browser state at failure: ${state.url}`);
      console.error(state.text);
    }
  }
  console.error(
    `[capture] Failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
} finally {
  if (screencastRunning && cdp) {
    await stopScreencast(cdp).catch(() => undefined);
  }
  if (cdp) {
    await cdp.send("Fetch.disable").catch(() => undefined);
    await cdp.send("Network.disable").catch(() => undefined);
  }
  if (page) await page.close().catch(() => undefined);
  if (browser) await browser.close({ silent: true }).catch(() => undefined);
}

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current.startsWith("--url=")) values.url = current.slice(6);
    else if (current === "--url") values.url = argv[++index];
    else if (current.startsWith("--output=")) values.output = current.slice(9);
    else if (current === "--output") values.output = argv[++index];
    else if (current === "--help" || current === "-h") {
      console.info(
        "Usage: node scripts/capture-hsa-journey.mjs [--url http://127.0.0.1:3000/] [--output path/to/video.mp4]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${current}`);
    }
  }
  return values;
}

function makeCaptureUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.searchParams.set("journeyCapture", "1");
  url.searchParams.delete("demoCapture");
  url.searchParams.delete("recordScan");
  return url.href;
}

async function assertDevServer(url) {
  let response;
  try {
    response = await fetch(url, { method: "GET", redirect: "manual" });
  } catch {
    throw new Error(
      `The HSA dev server is not reachable at ${url}. Start it with npm run dev first.`,
    );
  }
  if (!response.ok) {
    throw new Error(`The HSA dev server returned HTTP ${response.status}.`);
  }
}

function installNetworkObservers(client, origin, events) {
  client.on("Network.requestWillBeSent", ({ request }) => {
    try {
      const url = new URL(request.url);
      if (url.origin === origin && url.pathname === "/api/analyze") {
        events.analyze.push({ url: url.href, method: request.method });
      }
    } catch {
      // Ignore non-URL browser-internal requests.
    }
  });

  client.on("Fetch.requestPaused", ({ requestId, request }) => {
    void (async () => {
      let url;
      try {
        url = new URL(request.url);
      } catch {
        await client.send("Fetch.continueRequest", { requestId });
        return;
      }

      const blocked =
        url.origin === origin &&
        (url.pathname === "/api/lead" || url.pathname === "/api/report");
      if (!blocked) {
        await client.send("Fetch.continueRequest", { requestId });
        return;
      }

      events.blocked.push({ pathname: url.pathname, method: request.method });
      const body = Buffer.from(
        JSON.stringify({ ok: true, delivered: false, skipped: true }),
      ).toString("base64");
      await client.send("Fetch.fulfillRequest", {
        requestId,
        responseCode: 200,
        responsePhrase: "OK",
        responseHeaders: [
          { name: "Content-Type", value: "application/json; charset=utf-8" },
          { name: "Cache-Control", value: "no-store" },
        ],
        body,
      });
    })().catch((error) => {
      console.error(`[safety] Request interception failed: ${error.message}`);
    });
  });
}

async function enableNetworkGuard(client, origin) {
  await client.send("Network.enable");
  await client.send("Fetch.enable", {
    patterns: [
      { urlPattern: `${origin}/api/lead*`, requestStage: "Request" },
      { urlPattern: `${origin}/api/report*`, requestStage: "Request" },
    ],
  });
}

async function installInPageSafetyGuard(browserPage) {
  await browserPage.evaluateOnNewDocument(() => {
    const realFetch = window.fetch.bind(window);
    const blockedPaths = new Set(["/api/lead", "/api/report"]);
    window.__hsaCaptureBlockedRequests = [];

    const hideDevelopmentUi = () => {
      if (document.getElementById("hsa-capture-clean-ui")) return;
      const style = document.createElement("style");
      style.id = "hsa-capture-clean-ui";
      style.textContent = "nextjs-portal{display:none!important}";
      (document.head ?? document.documentElement)?.appendChild(style);
    };
    if (document.documentElement) hideDevelopmentUi();
    else {
      document.addEventListener("DOMContentLoaded", hideDevelopmentUi, {
        once: true,
      });
    }

    window.fetch = async (input, init) => {
      let candidate;
      try {
        candidate =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const url = new URL(candidate, window.location.href);
        if (
          url.origin === window.location.origin &&
          blockedPaths.has(url.pathname)
        ) {
          window.__hsaCaptureBlockedRequests.push({
            pathname: url.pathname,
            method: init?.method ?? "GET",
            at: Date.now(),
          });
          return new Response(
            JSON.stringify({ ok: true, delivered: false, skipped: true }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "no-store",
              },
            },
          );
        }
      } catch {
        // Let the native fetch surface malformed input just as production would.
      }
      return realFetch(input, init);
    };
  });
}

async function startScreencast(client) {
  client.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    capturedFrames.push({
      buffer: Buffer.from(data, "base64"),
      receivedAt: performance.now(),
      browserTimestamp: metadata?.timestamp ?? null,
    });
    void client
      .send("Page.screencastFrameAck", { sessionId })
      .catch(() => undefined);
  });

  await client.send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: CAPTURE_WIDTH,
    maxHeight: CAPTURE_HEIGHT,
    everyNthFrame: 1,
  });
}

async function stopScreencast(client) {
  await client.send("Page.stopScreencast");
  await hold(120);
}

async function waitForFirstFrame(frames, timeoutMs) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (frames.length > 0) return;
    await hold(50);
  }
  throw new Error("Chrome did not emit a screencast frame.");
}

async function waitForText(
  browserPage,
  text,
  timeoutMs,
  { failOnText = null } = {},
) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    const state = await browserPage.evaluate(
      ({ wanted, failure }) => {
        const body = document.body?.innerText ?? "";
        return {
          found: body.includes(wanted),
          failed: failure ? body.includes(failure) : false,
        };
      },
      { wanted: text, failure: failOnText },
    );
    if (state.found) return;
    if (state.failed) {
      throw new Error(
        `The analysis requested a retake instead of reaching "${text}".`,
      );
    }
    await hold(120);
  }
  throw new Error(`Timed out waiting for visible text: "${text}".`);
}

async function waitForEnabledButton(browserPage, text, timeoutMs) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    const enabled = await browserPage.evaluate((wanted) => {
      return Array.from(document.querySelectorAll("button")).some(
        (button) =>
          button.textContent?.trim() === wanted && !button.disabled,
      );
    }, text);
    if (enabled) return;
    await hold(80);
  }
  throw new Error(`Timed out waiting for enabled button: "${text}".`);
}

async function waitForHydratedControl(
  browserPage,
  selector,
  text,
  timeoutMs,
) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    const hydrated = await browserPage.evaluate(
      ({ css, wanted }) => {
        const element = Array.from(document.querySelectorAll(css)).find(
          (candidate) =>
            candidate.textContent?.replace(/\s+/g, " ").trim() === wanted,
        );
        if (!element) return false;
        const reactPropsKey = Object.keys(element).find((key) =>
          key.startsWith("__reactProps$"),
        );
        if (!reactPropsKey) return false;
        const props = element[reactPropsKey];
        return typeof props?.onClick === "function";
      },
      { css: selector, wanted: text },
    );
    if (hydrated) return;
    await hold(120);
  }
  throw new Error(`Timed out waiting for React hydration of "${text}".`);
}

async function touchClickByText(
  browserPage,
  selector,
  text,
  { exact = true } = {},
) {
  const result = await browserPage.evaluate(
    ({ css, wanted, exactMatch }) => {
      const candidates = Array.from(document.querySelectorAll(css));
      const element = candidates.find((candidate) => {
        const copy = candidate.textContent?.replace(/\s+/g, " ").trim() ?? "";
        return exactMatch ? copy === wanted : copy.includes(wanted);
      });
      if (!element) return { ok: false, reason: "not-found" };
      if ("disabled" in element && element.disabled) {
        return { ok: false, reason: "disabled" };
      }

      element.scrollIntoView({ block: "center", behavior: "auto" });
      const rect = element.getBoundingClientRect();
      return {
        ok: true,
        copy: element.textContent?.trim() ?? "",
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    },
    { css: selector, wanted: text, exactMatch: exact },
  );

  if (!result.ok) {
    throw new Error(`Could not click "${text}" (${result.reason}).`);
  }
  await hold(100);
  const client = browserPage._client();
  await client.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: result.x,
    y: result.y,
  });
  await client.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: result.x,
    y: result.y,
    button: "left",
    buttons: 1,
    clickCount: 1,
  });
  await hold(140);
  await client.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: result.x,
    y: result.y,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
}

async function injectRealFile(browserPage, assetUrl) {
  const result = await browserPage.evaluate(async (url) => {
    const input = document.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      return { ok: false, reason: "file-input-not-found" };
    }

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, reason: `asset-http-${response.status}` };
    }
    const blob = await response.blob();
    const file = new File([blob], "hsa-demo-pigmentation.jpg", {
      type: blob.type || "image/jpeg",
    });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: true, bytes: file.size, type: file.type };
  }, assetUrl);

  if (!result.ok) {
    throw new Error(`Could not inject the real demo selfie (${result.reason}).`);
  }
  console.info(
    `[capture] Uploaded licensed pigmentation image (${result.bytes} bytes, ${result.type})`,
  );
}

async function typeFieldByLabel(browserPage, labelText, value) {
  const result = await browserPage.evaluate(
    async ({ wantedLabel, wantedValue }) => {
      const label = Array.from(document.querySelectorAll("label")).find(
        (candidate) =>
          candidate.textContent?.replace(/\s+/g, " ").trim() === wantedLabel,
      );
      const input = label?.htmlFor
        ? document.getElementById(label.htmlFor)
        : label?.querySelector("input");
      if (!(input instanceof HTMLInputElement)) {
        return { ok: false };
      }

      input.scrollIntoView({ block: "center", behavior: "smooth" });
      await new Promise((resolve) => setTimeout(resolve, 180));
      input.focus();
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      if (!valueSetter) return { ok: false };

      valueSetter.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      for (let index = 0; index < wantedValue.length; index += 1) {
        valueSetter.call(input, wantedValue.slice(0, index + 1));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 28));
      }
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.blur();
      return { ok: true };
    },
    { wantedLabel: labelText, wantedValue: value },
  );

  if (!result.ok) throw new Error(`Could not fill field "${labelText}".`);
}

async function smoothScrollToText(
  browserPage,
  text,
  { selector, durationMs, offset },
) {
  const result = await browserPage.evaluate(
    async ({ wanted, css, duration, topOffset }) => {
      const target = Array.from(document.querySelectorAll(css)).find((node) =>
        node.textContent?.replace(/\s+/g, " ").trim().includes(wanted),
      );
      if (!target) return { ok: false };

      const start = window.scrollY;
      const destination = Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - topOffset,
      );
      const distance = destination - start;
      const startedAt = performance.now();
      await new Promise((resolve) => {
        const tick = (now) => {
          const progress = Math.min(1, (now - startedAt) / duration);
          const eased =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;
          window.scrollTo(0, start + distance * eased);
          if (progress < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      return { ok: true, destination };
    },
    { wanted: text, css: selector, duration: durationMs, topOffset: offset },
  );

  if (!result.ok) throw new Error(`Could not scroll to "${text}".`);
}

async function touchFirstMapArea(browserPage) {
  const result = await browserPage.evaluate(async () => {
    const button = document.querySelector('button[aria-label*="area"]');
    if (!(button instanceof HTMLButtonElement)) {
      return { ok: false };
    }
    const eventInit = {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
    };
    button.dispatchEvent(new PointerEvent("pointerdown", eventInit));
    await new Promise((resolve) => setTimeout(resolve, 120));
    button.dispatchEvent(new PointerEvent("pointerup", eventInit));
    button.click();
    return { ok: true, label: button.getAttribute("aria-label") };
  });
  if (!result.ok) {
    console.warn("[capture] Map pins were not ready; continuing with map view.");
  }
}

async function jumpToBookingCta(browserPage) {
  const result = await browserPage.evaluate(() => {
    const button = Array.from(document.querySelectorAll("button")).find(
      (candidate) =>
        candidate.textContent
          ?.replace(/\s+/g, " ")
          .trim()
          .includes("Book Your Free Online Consultation"),
    );
    if (!button) return { ok: false };
    const top = Math.max(
      0,
      button.getBoundingClientRect().top + window.scrollY -
        window.innerHeight / 2 +
        button.getBoundingClientRect().height / 2,
    );
    window.scrollTo({ top, behavior: "auto" });
    return { ok: true, top };
  });
  if (!result.ok) throw new Error("Could not find the consultation booking CTA.");
}

async function hidePlaceholderSections(browserPage) {
  const hidden = await browserPage.evaluate(() => {
    const headings = ["Real results, real patients", "What our patients say"];
    const removed = [];
    for (const headingText of headings) {
      const heading = Array.from(document.querySelectorAll("h3")).find(
        (candidate) =>
          candidate.textContent?.replace(/\s+/g, " ").trim() === headingText,
      );
      const componentRoot = heading?.parentElement;
      const resultSection = componentRoot?.parentElement;
      if (resultSection instanceof HTMLElement) {
        resultSection.style.setProperty("display", "none", "important");
        removed.push(headingText);
      }
    }
    return removed;
  });
  if (hidden.length !== 2) {
    console.warn(
      `[capture] Expected to hide two placeholder sections; hid ${hidden.length}.`,
    );
  }
}

async function waitForAnalyzeRequest(events, timeoutMs) {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if (events.analyze.length > 0) return;
    await hold(80);
  }
  throw new Error("No /api/analyze request was observed.");
}

async function encodeFrames({
  frames,
  durationMs,
  captureStartedAt: startedAt,
  outputPath: finalOutput,
}) {
  if (frames.length === 0) throw new Error("No frames were captured.");

  const temporaryOutput = `${finalOutput}.rendering-${process.pid}.mp4`;
  await fs.rm(temporaryOutput, { force: true });

  const ffmpegPath = RenderInternals.getExecutablePath({
    type: "ffmpeg",
    indent: false,
    logLevel: "error",
    binariesDirectory: null,
  });
  const ffmpeg = spawn(
    ffmpegPath,
    [
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      String(CAPTURE_FPS),
      "-vcodec",
      "mjpeg",
      "-i",
      "pipe:0",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      temporaryOutput,
    ],
    { stdio: ["pipe", "ignore", "pipe"] },
  );

  let stderr = "";
  ffmpeg.stderr.setEncoding("utf8");
  ffmpeg.stderr.on("data", (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-24_000);
  });

  const totalFrames = Math.max(1, Math.ceil((durationMs / 1_000) * CAPTURE_FPS));
  let sourceIndex = 0;
  try {
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
      const wantedAt = startedAt + (frameIndex / CAPTURE_FPS) * 1_000;
      while (
        sourceIndex + 1 < frames.length &&
        frames[sourceIndex + 1].receivedAt <= wantedAt
      ) {
        sourceIndex += 1;
      }
      const selected =
        wantedAt < frames[0].receivedAt ? frames[0] : frames[sourceIndex];
      if (!ffmpeg.stdin.write(selected.buffer)) {
        await once(ffmpeg.stdin, "drain");
      }
    }
    ffmpeg.stdin.end();
    const [exitCode] = await once(ffmpeg, "close");
    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${exitCode}. ${stderr.trim()}`);
    }
    await fs.rm(finalOutput, { force: true });
    await fs.rename(temporaryOutput, finalOutput);
  } catch (error) {
    ffmpeg.stdin.destroy();
    ffmpeg.kill();
    await fs.rm(temporaryOutput, { force: true });
    throw error;
  }
}

function hold(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function markMilestone(name) {
  if (!captureStartedAt) return;
  milestones.push({
    name,
    seconds: (performance.now() - captureStartedAt) / 1_000,
  });
}
