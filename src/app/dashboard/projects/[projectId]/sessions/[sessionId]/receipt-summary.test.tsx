import { render, screen } from "@testing-library/react";
import { ReceiptSummary } from "./receipt-summary";
import { generateSessionSummary } from "./actions";

// Mock the server action module
jest.mock("./actions", () => ({
  generateSessionSummary: jest.fn(),
}));

const mockGenerateSessionSummary = generateSessionSummary as jest.Mock;

describe("ReceiptSummary", () => {
  const events = [
    { id: "evt_1", type: "llm_call", name: "Parse invoice", durationMs: 2340 },
    { id: "evt_2", type: "tool_call", name: "Look up vendor", durationMs: 180 },
  ];

  beforeEach(() => {
    mockGenerateSessionSummary.mockClear();
  });

  it("displays existing summary without calling the API", () => {
    render(
      <ReceiptSummary
        sessionId="s_1"
        sessionName="Process invoice #441"
        existingSummary="The agent processed an invoice."
        autoGenerate={false}
        events={events}
      />,
    );

    expect(
      screen.getByText("The agent processed an invoice."),
    ).toBeInTheDocument();
    expect(screen.getByText("Regenerate")).toBeInTheDocument();
    expect(mockGenerateSessionSummary).not.toHaveBeenCalled();
  });

  it("does not auto-generate when autoGenerate is false", () => {
    render(
      <ReceiptSummary
        sessionId="s_1"
        sessionName={null}
        existingSummary={null}
        autoGenerate={false}
        events={events}
      />,
    );

    expect(mockGenerateSessionSummary).not.toHaveBeenCalled();
  });

  it("auto-generates summary on mount when autoGenerate is true", () => {
    mockGenerateSessionSummary.mockResolvedValue({
      summary: "Generated summary.",
    });

    render(
      <ReceiptSummary
        sessionId="s_1"
        sessionName="Process invoice"
        existingSummary={null}
        autoGenerate={true}
        events={events}
      />,
    );

    expect(mockGenerateSessionSummary).toHaveBeenCalledWith(
      "s_1",
      "Process invoice",
      events,
    );
  });
});
