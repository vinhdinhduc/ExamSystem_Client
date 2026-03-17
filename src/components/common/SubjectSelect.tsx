import { useEffect, useMemo, useState } from "react";
import Select from "../ui/Select";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { fetchSubjectOptions } from "../../redux/slices/subjectSlice";
import type { RootState } from "../../redux/store";

interface SubjectSelectProps {
  value?: number;
  onChange: (subjectId: number | undefined) => void;
}

const SubjectSelect = ({ value, onChange }: SubjectSelectProps) => {
  const dispatch = useAppDispatch();
  const { options, optionsLoading } = useAppSelector(
    (state: RootState) => state.subject,
  );
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void dispatch(fetchSubjectOptions(keyword));
    }, 300);

    return () => window.clearTimeout(timerId);
  }, [dispatch, keyword]);

  const selectOptions = useMemo(
    () =>
      options.map((subject) => ({
        value: subject.id,
        label: `${subject.subjectCode} - ${subject.subjectName}`,
        meta: subject.description ?? undefined,
      })),
    [options],
  );

  return (
    <Select
      options={selectOptions}
      value={value}
      onChange={(nextValue) =>
        onChange(nextValue ? Number(nextValue) : undefined)
      }
      searchable
      loading={optionsLoading}
      searchValue={keyword}
      onSearchChange={setKeyword}
      placeholder="Chọn môn học"
    />
  );
};

export default SubjectSelect;
