import React from "react";
import { Link } from "react-router-dom";

const phaseColors = {
  2: "blue",
  3: "purple",
  4: "orange",
};

const phaseDescriptions = {
  2: "AI Intelligence + Merchant Memory + External Context",
  3: "Agentic Actions + n8n Automation",
  4: "Outcome Learning + Final Product Polish",
};

export default function ComingSoon({ feature = "Feature", phase = 2 }) {
  const color = phaseColors[phase] || "blue";
  const desc = phaseDescriptions[phase] || "";

  return (
    <div className="flex-1 flex items-center justify-center min-h-full p-8">
      <div className="text-center max-w-md">
        <div className={`inline-flex items-center justify-center w-20 h-20 bg-${color}-100 rounded-2xl mb-6`}>
          <span className={`text-2xl font-black text-${color}-700`}>
            P{phase}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{feature}</h1>
        <p className={`text-sm font-semibold text-${color}-600 mb-3`}>Coming in Phase {phase}</p>
        <p className="text-gray-500 text-sm mb-6">{desc}</p>
        <div className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4 text-sm text-${color}-700 text-left mb-6`}>
          <p className="font-medium mb-1">What to expect in Phase {phase}:</p>
          {phase === 2 && (
            <ul className="list-disc pl-4 space-y-1 text-xs">
              <li>Groq AI integration</li>
              <li>Natural-language business Q&amp;A</li>
              <li>Proactive Growth Detector</li>
              <li>Cognee merchant memory</li>
              <li>External context (weather, festivals)</li>
            </ul>
          )}
          {phase === 3 && (
            <ul className="list-disc pl-4 space-y-1 text-xs">
              <li>n8n workflow automation</li>
              <li>Approve &amp; execute AI recommendations</li>
              <li>Campaign generation</li>
              <li>Scheduled daily business brief</li>
            </ul>
          )}
          {phase === 4 && (
            <ul className="list-disc pl-4 space-y-1 text-xs">
              <li>Campaign outcome tracking</li>
              <li>Before/after metrics</li>
              <li>AI learning from results</li>
              <li>Personalized recommendations</li>
            </ul>
          )}
        </div>
        <Link to="/dashboard" className="btn-primary inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}