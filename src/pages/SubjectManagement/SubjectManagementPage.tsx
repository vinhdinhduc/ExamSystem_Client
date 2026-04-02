import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import FormInput from "../../components/ui/FormInput";
import Card from "../../components/ui/Card";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import {
  createSubject,
  deleteSubject,
  fetchSubjects,
  setKeyword,
  setPage,
  toggleSubject,
  updateSubject,
} from "../../redux/slices/subjectSlice";
import type { RootState } from "../../redux/store";
import type { SubjectPayload } from "../../types/subject";

const defaultValues: SubjectPayload = {
  code: "",
  name: "",
  description: "",
  isActive: true,
};

const SubjectManagementPage = () => {
  const dispatch = useAppDispatch();
  const { subjects, loading, keyword, page, totalPages } = useAppSelector(
    (state: RootState) => state.subject,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectPayload>({
    defaultValues,
  });

  useEffect(() => {
    void dispatch(fetchSubjects());
  }, [dispatch, keyword, page]);

  const openCreate = () => {
    setEditingId(null);
    reset(defaultValues);
    setModalOpen(true);
  };

  const onSubmit = handleSubmit(async (data) => {
    if (editingId) {
      const result = await dispatch(
        updateSubject({ id: editingId, payload: data }),
      );
      if (updateSubject.fulfilled.match(result)) {
        toast.success("Cập nhật môn học thành công");
        setModalOpen(false);
      }
      return;
    }

    const result = await dispatch(createSubject(data));
    if (createSubject.fulfilled.match(result)) {
      toast.success("Tạo môn học thành công");
      setModalOpen(false);
    }
  });

  const rows = useMemo(() => subjects, [subjects]);

  return (
    <section className="subject-page">
      <Card title="Quản lý môn học" className="subject-page__header-card">
        <div className="subject-page__toolbar">
          <input
            value={keyword}
            onChange={(event) => dispatch(setKeyword(event.target.value))}
            className="subject-page__search"
            placeholder="Tìm kiếm môn học"
          />
          <Button onClick={openCreate}>Thêm môn học</Button>
        </div>
      </Card>

      <Card className="subject-page__table-card">
        <Table
          columns={[
            { key: "code", title: "Mã môn" },
            { key: "name", title: "Tên môn" },
            { key: "description", title: "Mô tả" },
            {
              key: "isActive",
              title: "Trạng thái",
              render: (row) =>
                row.isActive ? "Đang hoạt động" : "Ngừng hoạt động",
            },
            {
              key: "actions",
              title: "Thao tác",
              render: (row) => (
                <div className="subject-page__actions">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(row.id);
                      reset({
                        code: row.code,
                        name: row.name,
                        description: row.description ?? "",
                        isActive: row.isActive,
                      });
                      setModalOpen(true);
                    }}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      void dispatch(deleteSubject(row.id));
                    }}
                  >
                    Xóa
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      void dispatch(
                        toggleSubject({ id: row.id, isActive: !row.isActive }),
                      );
                    }}
                  >
                    Bật/Tắt
                  </Button>
                </div>
              ),
            },
          ]}
          data={rows}
          rowKey={(row) => row.id}
        />

        <Pagination
          page={page}
          totalPages={Math.max(1, totalPages)}
          onChange={(next) => dispatch(setPage(next))}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? "Chỉnh sửa môn học" : "Tạo môn học"}
        onClose={() => setModalOpen(false)}
      >
        <form
          className="subject-page__form"
          onSubmit={(event) => void onSubmit(event)}
        >
          <FormInput
            label="Mã môn học"
            registration={register("code", {
              required: "Vui lòng nhập mã môn học",
            })}
            error={errors.code}
          />
          <FormInput
            label="Tên môn học"
            registration={register("name", {
              required: "Vui lòng nhập tên môn học",
            })}
            error={errors.name}
          />
          <FormInput
            label="Mô tả"
            registration={register("description")}
            error={errors.description}
          />
          <label className="subject-page__checkbox">
            <input type="checkbox" {...register("isActive")} />
            Đang hoạt động
          </label>
          <Button type="submit" disabled={loading}>
            {editingId ? "Lưu thay đổi" : "Tạo môn học"}
          </Button>
        </form>
      </Modal>
    </section>
  );
};

export default SubjectManagementPage;
