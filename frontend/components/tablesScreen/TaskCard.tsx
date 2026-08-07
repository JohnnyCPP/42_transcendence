import { TaskType } from "@/types/task/TaskType";

export default function TaskCard({ task }: { task: TaskType }) {
    return (
        <div className="bg-amber-600 rounded-lg shadow-md p-4 w-full">
            <h2 className="text-lg font-semibold mb-2 text-white">{task.title}</h2>
            <p className="text-white">{task.description}</p>
        </div>
    );
}