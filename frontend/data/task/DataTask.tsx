import { TaskType } from "@/types/task/TaskType";

export const Tasks : TaskType[] = [
    {
       id: 1,
       title: "Task 1",
       description: "This is the first task.",
       status: "pending",
       createdAt: "2023-01-01T00:00:00Z",
       updatedAt: "2023-01-01T00:00:00Z"
    },
    {
        id: 2,
        title: "Task 2",
        description: "This is the second task.",
        status: "in_progress",
        createdAt: "2023-01-02T00:00:00Z",
        updatedAt: "2023-01-02T00:00:00Z"
    }
];