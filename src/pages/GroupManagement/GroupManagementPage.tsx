import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Table from "../../components/ui/Table";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import {
  createGroup,
  fetchGroups,
  removeGroupMember,
} from "../../redux/slices/groupSlice";
import type { RootState } from "../../redux/store";
import type { GroupPayload } from "../../types/group";

const GroupManagementPage = () => {
  const dispatch = useAppDispatch();
  const { groups } = useAppSelector((state: RootState) => state.group);
  const { register, handleSubmit, reset } = useForm<GroupPayload>();

  useEffect(() => {
    void dispatch(fetchGroups());
  }, [dispatch]);

  const onSubmit = handleSubmit(async (payload) => {
    const result = await dispatch(createGroup(payload));
    if (createGroup.fulfilled.match(result)) {
      toast.success("Class created");
      reset({ groupCode: "", groupName: "", description: "" });
    }
  });

  return (
    <section className="group-page">
      <Card title="Group / Class Management">
        <form
          className="group-page__form"
          onSubmit={(event) => void onSubmit(event)}
        >
          <input
            {...register("groupCode", { required: true })}
            placeholder="Group code"
          />
          <input
            {...register("groupName", { required: true })}
            placeholder="Group name"
          />
          <input {...register("description")} placeholder="Description" />
          <Button type="submit">Create Class</Button>
        </form>
      </Card>

      <Card>
        <Table
          columns={[
            { key: "groupCode", title: "Code" },
            { key: "groupName", title: "Class Name" },
            {
              key: "members",
              title: "Members",
              render: (row) => `${row.members.length} members`,
            },
            {
              key: "remove",
              title: "Actions",
              render: (row) => (
                <div className="group-page__member-list">
                  {row.members.map((member) => (
                    <div key={member.id} className="group-page__member-item">
                      <div className="group-page__avatar">
                        {member.fullName.charAt(0)}
                      </div>
                      <span>{member.fullName}</span>
                      <Button
                        variant="outline"
                        onClick={() => {
                          void dispatch(
                            removeGroupMember({
                              groupId: row.id,
                              userId: member.id,
                            }),
                          );
                          toast.info("Member removed");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
          data={groups}
          rowKey={(row) => row.id}
        />
      </Card>
    </section>
  );
};

export default GroupManagementPage;
