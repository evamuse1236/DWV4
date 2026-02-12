import katex from "katex";

interface SegmentText {
  kind: "text";
  value: string;
}

interface SegmentMath {
  kind: "math";
  value: string;
}

type Segment = SegmentText | SegmentMath;

const INLINE_LATEX_RE = /\\\((.+?)\\\)|\$\$(.+?)\$\$|\$(.+?)\$/g;
const AUTO_MATH_RE =
  /(?<![\d.])-?\d+\s+-?\d+\s*\/\s*-?\d+(?![\d.])|(?<![\d.])-?\d+(?:\.\d+)?\s*\/\s*-?\d+(?:\^-?\d+)?(?![\d.])|(?<![\d.])-?\d+(?:\.\d+)?(?:\s*[+\-×÷]\s*-?\d+(?:\.\d+)?)+(?![\d.])/g;

function parseAutoMath(text: string): Segment[] {
  const out: Segment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  AUTO_MATH_RE.lastIndex = 0;

  while ((m = AUTO_MATH_RE.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;

    if (start > lastIndex) {
      out.push({ kind: "text", value: text.slice(lastIndex, start) });
    }

    out.push({ kind: "math", value: toMathLatex(m[0]) });
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    out.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return out;
}

function toMathLatex(token: string): string {
  const raw = token.trim();
  const normalized = raw.replace(/\s*\/\s*/g, "/");

  const spacedDivision = raw.match(
    /^(-?\d+(?:\.\d+)?)\s+\/\s+(-?\d+(?:\.\d+)?(?:\^-?\d+)?)$/
  );
  if (spacedDivision) {
    const [, num, den] = spacedDivision;
    return `${num}\\div ${den}`;
  }

  const mixed = normalized.match(/^(-?\d+)\s+(-?\d+)\/(-?\d+)$/);
  if (mixed) {
    const [, whole, num, den] = mixed;
    return `${whole}\\,\\frac{${num}}{${den}}`;
  }

  const poweredFraction = normalized.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\^(-?\d+)$/);
  if (poweredFraction) {
    const [, num, denBase, denExp] = poweredFraction;
    return `\\frac{${num}}{${denBase}^{${denExp}}}`;
  }

  const fraction = normalized.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const [, num, den] = fraction;
    return `\\frac{${num}}{${den}}`;
  }

  const division = normalized.match(/^(-?\d+(?:\.\d+)?)\s*÷\s*(-?\d+(?:\.\d+)?)$/);
  if (division) {
    const [, num, den] = division;
    return `\\frac{${num}}{${den}}`;
  }

  const expression = raw.replace(/×/g, "\\times ").replace(/÷/g, "\\div ");
  if (expression !== raw) {
    return expression;
  }

  return normalized;
}

function parseMathAwareSegments(text: string): Segment[] {
  const out: Segment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  INLINE_LATEX_RE.lastIndex = 0;

  while ((m = INLINE_LATEX_RE.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;

    if (start > lastIndex) {
      out.push(...parseAutoMath(text.slice(lastIndex, start)));
    }

    const latex = m[1] ?? m[2] ?? m[3] ?? "";
    out.push({ kind: "math", value: latex });
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    out.push(...parseAutoMath(text.slice(lastIndex)));
  }

  return out;
}

function renderLatex(latex: string): string {
  return katex.renderToString(latex, {
    throwOnError: false,
    strict: "ignore",
    output: "html",
  });
}

export function MathText({
  text,
  className,
}: {
  text: string | null | undefined;
  className?: string;
}) {
  const safeText = text ?? "";
  const segments = parseMathAwareSegments(safeText);

  return (
    <span className={className}>
      {segments.map((segment, idx) => {
        if (segment.kind === "text") {
          return <span key={`txt-${idx}`}>{segment.value}</span>;
        }
        return (
          <span
            key={`math-${idx}`}
            className="inline-block align-middle mx-0.5"
            dangerouslySetInnerHTML={{ __html: renderLatex(segment.value) }}
          />
        );
      })}
    </span>
  );
}

export default MathText;
