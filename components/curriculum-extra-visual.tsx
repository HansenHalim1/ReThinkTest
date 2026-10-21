'use client';
import TopicVisualization from '@/components/topic-visualization';
// Every topic now has a mathematical diagram with an actual model parameter.
export default function CurriculumExtraVisual({ id }: { id: string }) {
 return <TopicVisualization key={id} id={id} />;
}
