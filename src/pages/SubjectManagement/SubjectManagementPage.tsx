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
  subjectCode: "",
  subjectName: "",
  description: "",
  isActive: true,
};

const SubjectManagementPage = () => {
  const dispatch = useAppDispatch();
  const { subjects, loading, keyword, page } = useAppSelector(
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
        toast.success("Subject updated");
        setModalOpen(false);
      }
      return;
    }

    const result = await dispatch(createSubject(data));
    if (createSubject.fulfilled.match(result)) {
      toast.success("Subject created");
      setModalOpen(false);
    }
  });

  const rows = useMemo(() => subjects, [subjects]);

  return (
    <section className="subject-page">
      <Card title="Subject Management" className="subject-page__header-card">
        <div className="subject-page__toolbar">
          <input
            value={keyword}
            onChange={(event) => dispatch(setKeyword(event.target.value))}
            className="subject-page__search"
            placeholder="Search subject"
          />
          <Button onClick={openCreate}>Add Subject</Button>
        </div>
      </Card>

      <Card className="subject-page__table-card">
        <Table
          columns={[
            { key: "subjectCode", title: "Code" },
            { key: "subjectName", title: "Name" },
            { key: "description", title: "Description" },
            {
              key: "isActive",
              title: "Status",
              render: (row) => (row.isActive ? "Active" : "Inactive"),
            },
            {
              key: "actions",
              title: "Actions",
              render: (row) => (
                <div className="subject-page__actions">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingId(row.id);
                      reset({
                        subjectCode: row.subjectCode,
                        subjectName: row.subjectName,
                        description: row.description ?? "",
                        isActive: row.isActive,
                      });
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      void dispatch(deleteSubject(row.id));
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      void dispatch(
                        toggleSubject({ id: row.id, isActive: !row.isActive }),
                      );
                    }}
                  >
                    Toggle
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
          totalPages={Math.max(1, Math.ceil(rows.length / 10))}
          onChange={(next) => dispatch(setPage(next))}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? "Edit Subject" : "Create Subject"}
        onClose={() => setModalOpen(false)}
      >
        <form
          className="subject-page__form"
          onSubmit={(event) => void onSubmit(event)}
        >
          <FormInput
            label="Subject Code"
            registration={register("subjectCode", { required: "Required" })}
            error={errors.subjectCode}
          />
          <FormInput
            label="Subject Name"
            registration={register("subjectName", { required: "Required" })}
            error={errors.subjectName}
          />
          <FormInput
            label="Description"
            registration={register("description")}
            error={errors.description}
          />
          <label className="subject-page__checkbox">
            <input type="checkbox" {...register("isActive")} />
            Active
          </label>
          <Button type="submit" disabled={loading}>
            {editingId ? "Save Changes" : "Create Subject"}
          </Button>
        </form>
      </Modal>
    </section>
  );
};

export default SubjectManagementPage;
