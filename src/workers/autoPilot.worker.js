import { buildAutoPilotPlotting } from "../lib/autoPilot.js";

self.onmessage = (event) => {
  const { lecturers, courses, classCounts, assignmentMap } = event.data;
  try {
    const result = buildAutoPilotPlotting(
      lecturers,
      courses,
      classCounts,
      assignmentMap,
    );
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Auto-pilot failed.",
    });
  }
};
