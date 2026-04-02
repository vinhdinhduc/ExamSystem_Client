import { useMemo, useState } from "react";
import { IoChevronDown, IoSearch } from "react-icons/io5";
import type { SelectOption } from "../../types/shared";

interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  values?: Array<string | number>;
  onChange: (value: string) => void;
  onMultiChange?: (values: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  loading?: boolean;
  multiple?: boolean;
}

const Select = ({
  options,
  value,
  values,
  onChange,
  onMultiChange,
  placeholder,
  searchable = false,
  searchValue,
  onSearchChange,
  loading = false,
  multiple = false,
}: SelectProps) => {
  const [localKeyword, setLocalKeyword] = useState("");

  const keyword = searchValue ?? localKeyword;
  const filtered = useMemo(
    () =>
      options.filter((option) =>
        option.label.toLowerCase().includes(keyword.toLowerCase()),
      ),
    [keyword, options],
  );

  const handleSearchChange = (nextValue: string) => {
    if (onSearchChange) {
      onSearchChange(nextValue);
      return;
    }

    setLocalKeyword(nextValue);
  };

  return (
    <div className="ui-select">
      {searchable ? (
        <label className="ui-select__search-wrap">
          <IoSearch className="ui-select__search-icon" />
          <input
            className="ui-select__search"
            value={keyword}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Tìm kiếm..."
          />
        </label>
      ) : null}
      <div className="ui-select__control-wrap">
        <select
          className={`ui-select__control ${multiple ? "ui-select__control--multiple" : ""}`.trim()}
          value={multiple ? (values?.map(String) ?? []) : String(value ?? "")}
          multiple={multiple}
          onChange={(event) => {
            if (multiple) {
              onMultiChange?.(
                Array.from(event.target.selectedOptions).map(
                  (option) => option.value,
                ),
              );
              return;
            }

            onChange(event.target.value);
          }}
        >
          {multiple ? null : (
            <option value="">{placeholder ?? "Vui lòng chọn"}</option>
          )}
          {filtered.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
        {!multiple ? <IoChevronDown className="ui-select__arrow" /> : null}
      </div>
      {loading ? (
        <span className="ui-select__meta">Đang tải dữ liệu...</span>
      ) : null}
    </div>
  );
};

export default Select;
