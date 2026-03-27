import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Issue } from "@/types";
import { issueService } from "@/services/issueService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { IssueHeader } from "./issues/details/IssueHeader";
import { IssueMainContent } from "./issues/details/IssueMainContent";
import { IssueSidebar } from "./issues/details/IssueSidebar";

interface IssueDetailModalProps {
    issue: Issue;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function IssueDetailModal({
    issue: initialIssue,
    onClose,
    onUpdate,
}: IssueDetailModalProps) {
    if (!initialIssue) return null;

    const [issue, setIssue] = useState(initialIssue);
    const [editing, setEditing] = useState<{ [key: string]: boolean }>({});
    const [editValues, setEditValues] = useState({
        title: initialIssue.title,
        description: initialIssue.description || "",
        type: initialIssue.type,
        status: initialIssue.status,
        priority: initialIssue.priority,
        assigneeId: initialIssue.assigneeId,
        storyPoints: initialIssue.storyPoints,
    });
    const [comments, setComments] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const { toast } = useToast();
    const { t } = useTranslation();

    useEffect(() => {
        if (initialIssue) {
            setIssue(initialIssue);
            setEditValues({
                title: initialIssue.title,
                description: initialIssue.description || "",
                type: initialIssue.type,
                status: initialIssue.status,
                priority: initialIssue.priority,
                assigneeId: initialIssue.assigneeId,
                storyPoints: initialIssue.storyPoints,
            });
        }
    }, [initialIssue]);

    useEffect(() => {
        if (issue?.id) {
            fetchIssueDetails();
            fetchComments();
            fetchActivities();
        }
    }, [issue?.id]);

    const fetchIssueDetails = async () => {
        try {
            const data = await issueService.getById(issue.id);
            setIssue(data);
            setEditValues({
                title: data.title,
                description: data.description || "",
                type: data.type,
                status: data.status,
                priority: data.priority,
                assigneeId: data.assigneeId,
                storyPoints: data.storyPoints,
            });
        } catch (error) {
            console.error("Failed to fetch issue:", error);
        }
    };

    const fetchComments = async () => {
        try {
            const data = await issueService.getComments(issue.id);
            setComments(data);
        } catch (error) {
            console.error("Failed to fetch comments:", error);
            setComments([]);
        }
    };

    const fetchActivities = async () => {
        try {
            const data = await issueService.getActivities(issue.id);
            setActivities(data);
        } catch (error) {
            console.error("Failed to fetch activities:", error);
            setActivities([]);
        }
    };

    const handleUpdate = async (field: string, value: any) => {
        try {
            const updateData = {
                title: editValues.title,
                description: editValues.description,
                type: editValues.type,
                status: editValues.status,
                priority: editValues.priority,
                assigneeId: editValues.assigneeId,
                sprintId: issue.sprintId,
                storyPoints: editValues.storyPoints,
                [field]: value,
            };

            await issueService.update(issue.id, updateData);
            await fetchIssueDetails();
            setEditing({ ...editing, [field]: false });
            onUpdate?.();

            toast({
                title: t('common.updated'),
                description: t('issue.update_success'),
            });
        } catch (error) {
            console.error("Failed to update issue:", error);
            toast({
                title: "Error",
                description: t('issue.update_failed'),
                variant: "destructive",
            });
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 sm:p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    className="relative w-full max-w-[1100px] h-[90vh] glass-card bg-slate-900/60 rounded-3xl shadow-2xl shadow-black/40 flex flex-col border border-white/10 overflow-hidden"
                >
                    {/* Decorative background blurs */}
                    <div className="absolute -top-16 -right-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                    <IssueHeader
                        issue={issue}
                        onClose={onClose}
                        isEditingTitle={editing.title || false}
                        editTitleValue={editValues.title}
                        onTitleClick={() => setEditing({ ...editing, title: true })}
                        onTitleChange={(val) => setEditValues({ ...editValues, title: val })}
                        onTitleBlur={() => handleUpdate("title", editValues.title)}
                        onTitleKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate("title", editValues.title);
                            if (e.key === "Escape") setEditing({ ...editing, title: false });
                        }}
                    />

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-full">
                            <IssueMainContent
                                issue={issue}
                                isEditingDescription={editing.description || false}
                                editDescriptionValue={editValues.description}
                                onDescriptionClick={() => setEditing({ ...editing, description: true })}
                                onDescriptionChange={(val) => setEditValues({ ...editValues, description: val })}
                                onDescriptionBlur={() => handleUpdate("description", editValues.description)}
                                comments={comments}
                                activities={activities}
                                onSubtaskChange={fetchIssueDetails}
                                onCommentAdded={fetchComments}
                            />

                            <IssueSidebar
                                issue={issue}
                                status={editValues.status}
                                priority={editValues.priority}
                                assigneeId={editValues.assigneeId}
                                storyPoints={editValues.storyPoints}
                                onStatusChange={(val) => {
                                    setEditValues({ ...editValues, status: val as any });
                                    handleUpdate("status", val);
                                }}
                                onPriorityChange={(val) => {
                                    setEditValues({ ...editValues, priority: val as any });
                                    handleUpdate("priority", val);
                                }}
                                onAssigneeChange={(val) => {
                                    setEditValues({ ...editValues, assigneeId: val });
                                    handleUpdate("assigneeId", val);
                                }}
                                onStoryPointsChange={(val) => setEditValues({ ...editValues, storyPoints: val })}
                                onStoryPointsBlur={() => handleUpdate("storyPoints", editValues.storyPoints)}
                                onUpdateLabels={fetchIssueDetails}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
