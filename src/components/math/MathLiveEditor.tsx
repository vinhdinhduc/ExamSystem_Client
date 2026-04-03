import { useEffect, useRef } from "react";

// MathLive là web component, cần import để đăng ký custom element + CSS
import "mathlive/static.css";
import "mathlive/fonts.css";
import "mathlive";

interface MathLiveEditorProps {
  // Giá trị LaTeX hiện tại
  value: string;
  // Callback khi người dùng thay đổi nội dung
  onChange: (nextLatex: string) => void;
  // Placeholder hiển thị khi ô trống
  placeholder?: string;
  // ClassName để điều chỉnh layout
  className?: string;
  // Khóa không cho chỉnh sửa
  disabled?: boolean;
}

const MathLiveEditor = ({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: MathLiveEditorProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mathfieldRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);

  // Luôn dùng onChange mới nhất để tránh stale closure
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Khởi tạo MathLive web component (không dùng JSX <math-field> để tránh lỗi typing)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Tạo math-field nếu chưa tồn tại
    if (!mathfieldRef.current) {
      const el = document.createElement("math-field") as any;
      // Nếu không truyền className thì dùng mặc định để khớp style hệ thống
      el.className = className ?? "mathlive-editor";
      if (placeholder) el.setAttribute("placeholder", placeholder);
      container.appendChild(el);
      mathfieldRef.current = el;
    }

    const mathfield = mathfieldRef.current;
    if (!mathfield) return;

    // Cấu hình editor cơ bản
    mathfield.setOptions({
      smartMode: true, // Hỗ trợ nhập theo dạng thông minh
      // Để người dùng nhập chữ tiếng Việt bình thường không bị MathLive ép sang math-mode (tránh lỗi dấu tách font)
      defaultMode: "text",
      // API chính thức: không tự mở bàn phím ảo; nút bàn phím ẩn bằng CSS ::part
      mathVirtualKeyboardPolicy: "manual",
      // Chữ trong math-mode ít nghiêng hơn, gần font UI sans-serif hơn
      letterShapeStyle: "upright",
      readOnly: Boolean(disabled),
    });

    const handleInput = () => {
      const latex = mathfield.getValue?.("latex") ?? "";
      onChangeRef.current(latex);
    };

    // Bắt sự kiện input của MathLive
    mathfield.addEventListener("input", handleInput);

    return () => {
      mathfield.removeEventListener("input", handleInput);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Đồng bộ giá trị từ state/props sang MathLive
  useEffect(() => {
    const mathfield = mathfieldRef.current;
    if (!mathfield) return;

    const currentLatex = mathfield.getValue?.("latex") ?? "";
    if (currentLatex !== (value ?? "")) {
      mathfield.setValue?.(value ?? "");
    }
  }, [value]);

  // Đồng bộ trạng thái readOnly khi disabled thay đổi
  useEffect(() => {
    const mathfield = mathfieldRef.current;
    if (!mathfield) return;
    mathfield.setOptions({ readOnly: Boolean(disabled) });
  }, [disabled]);

  // Đồng bộ class/placeholder khi props thay đổi
  useEffect(() => {
    const mathfield = mathfieldRef.current;
    if (!mathfield) return;
    mathfield.className = className ?? "mathlive-editor";
    if (placeholder !== undefined) {
      // Nếu placeholder là rỗng chuỗi thì vẫn set để tránh UI mơ hồ
      mathfield.setAttribute("placeholder", placeholder ?? "");
    }
  }, [className, placeholder]);

  return <div ref={containerRef} />;
};

export default MathLiveEditor;

