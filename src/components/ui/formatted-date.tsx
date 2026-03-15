"use client";

type FormattedDateProps = {
  date: Date | string;
  format?: "full" | "date" | "time" | "date-short";
};

export function FormattedDate({ date, format = "full" }: FormattedDateProps) {
  const d = date instanceof Date ? date : new Date(date);

  switch (format) {
    case "date":
      return (
        <>
          {d.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </>
      );
    case "date-short":
      return (
        <>
          {d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </>
      );
    case "time":
      return <>{d.toLocaleTimeString()}</>;
    case "full":
    default:
      return <>{d.toLocaleString()}</>;
  }
}
