import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface TeamDropZoneProps {
    id: string;
    className?: string;
    children: ReactNode;
}

export const TeamDropZone = ({ id, className, children }: TeamDropZoneProps) => {
    const { isOver, setNodeRef } = useDroppable({
        id: id,
    });

    return (
        <div ref={setNodeRef} className={`${className || ''} transition-all ${isOver ? id === 'A' ? 'ring-4 ring-info ring-inset bg-info/5' : 'ring-4 ring-error ring-inset bg-error/5' : ''}`}>
            {children}
        </div>
    );
};
