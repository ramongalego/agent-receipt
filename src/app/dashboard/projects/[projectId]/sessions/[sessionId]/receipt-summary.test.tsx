import { render, screen } from "@testing-library/react";
import { ReceiptSummary } from "./receipt-summary";
import { generateSessionSummary } from "./actions";

// Mock the server action module
jest.mock("./actions", () => ({
  generateSessionSummary: jest.fn(),
}));

const mockGenerateSessionSummary = generateSessionSummary as jest.Mock;

describe("ReceiptSummary", () => {
  beforeEach(() => {
    mockGenerateSessionSummary.mockClear();
  });

  it("displays existing summary without calling the API", () => {
    render(
      <ReceiptSummary
        sessionId="s_1"
        existingSummary="The agent processed an invoice."
        autoGenerate={false}
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
        existingSummary={null}
        autoGenerate={false}
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
        existingSummary={null}
        autoGenerate={true}
      />,
    );

    // Only the session id crosses the client boundary. Events are fetched
    // server-side by the action.
    expect(mockGenerateSessionSummary).toHaveBeenCalledWith("s_1");
  });
});
