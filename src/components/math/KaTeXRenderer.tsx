import { useMemo } from "react";
import katex from "katex";

// Import CSS để KaTeX hiển thị đúng kiểu mặc định
import "katex/dist/katex.min.css";

type KaTeXAs = "span" | "div" | "p";

interface KaTeXRendererProps {
  // Chuỗi LaTeX (ví dụ: \frac{a}{b} hoặc nội dung MathLive trả về)
  latex: string;
  // Chọn chế độ hiển thị cho KaTeX
  displayMode?: boolean;
  // Chọn tag bao ngoài để phù hợp UI
  as?: KaTeXAs;
  // ClassName áp dụng cho container
  className?: string;
}

// Chuẩn hóa chuỗi từ MathLive/API để KaTeX parse được (bỏ $ bọc ngoài, lệnh chỉ có ở MathLive)
const normalizeLatexForKaTeX = (input: string): string => {
  let s = input.trim();
  // Bỏ $$ ... $$ hoặc $ ... $ do MathLive đôi khi lưu kèm delimiter — KaTeX renderToString không cần $
  if (s.length >= 4 && s.startsWith("$$") && s.endsWith("$$")) {
    s = s.slice(2, -2).trim();
  } else if (s.length >= 2 && s.startsWith("$") && s.endsWith("$")) {
    s = s.slice(1, -1).trim();
  }
  // \placeholder{} là macro MathLive, KaTeX không có → thay bằng ô trống hợp lệ
  s = s.replace(/\\placeholder\b(?:\{[^{}]*\})?/g, "\\Box");
  return s;
};

const KaTeXRenderer = ({
  latex,
  displayMode = false,
  as = "span",
  className,
}: KaTeXRendererProps) => {
  // Render HTML một lần khi latex/displayMode thay đổi
  const html = useMemo(() => {
    const raw = (latex ?? "").trim();
    if (!raw) return null;

    const normalized = normalizeLatexForKaTeX(raw);

    // Heuristic: chỉ render bằng KaTeX khi chuỗi có dấu hiệu là công thức LaTeX math.
    // Nếu là văn bản thuần (ví dụ chứa tiếng Việt, không có lệnh LaTeX và không có ^/_),
    // render bằng KaTeX sẽ làm dấu tiếng Việt bị tách (do KaTeX dùng font/toán tử math).
    const looksLikeMath =
      /\\[a-zA-Z]+/.test(normalized) || // Ví dụ: \frac, \sqrt, \sin...
      normalized.includes("^") ||
      normalized.includes("_") ||
      // Các toán tử phổ biến trong công thức dạng thường
      /[=+\-*/<>]/.test(normalized) ||
      // Một số lệnh phổ biến (dù đã bắt bởi regex có \ nhưng giữ rõ ràng hơn)
      /\\(frac|sqrt|sum|int|left|right|cdot|times|leq|geq|neq)/.test(
        normalized,
      );

    if (!looksLikeMath) return null;

    try {
      // renderToString sẽ tạo HTML đã được KaTeX escape/render
      return katex.renderToString(normalized, {
        displayMode,
        throwOnError: false,
        // Màu lỗi gần với chữ bình thường để không “đỏ nguyên dòng” khi còn ký tự lạ
        errorColor: "#5f728c",
        macros: {
          // Phòng khi còn sót biến thể placeholder
          "\\placeholder": "\\Box",
        },
      });
    } catch {
      // Nếu chuỗi không phải LaTeX hợp lệ, fallback hiển thị text thuần
      return null;
    }
  }, [latex, displayMode]);

  const Tag = as;

  if (!html) {
    // Fallback: hiển thị text thuần để không làm vỡ giao diện
    return <Tag className={className}>{latex}</Tag>;
  }

  // dangerouslySetInnerHTML dùng với output do KaTeX generate, không lấy từ user trực tiếp
  return (
    <Tag
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default KaTeXRenderer;

