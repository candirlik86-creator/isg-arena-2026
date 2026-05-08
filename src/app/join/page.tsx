import { ProjectionFrame } from "@/components/ProjectionFrame";
import { TeamJoinPanel } from "@/components/TeamJoinPanel";

export default function JoinPage() {
  return (
    <ProjectionFrame eyebrow="Takım Katılımı" title="PIN ile Katılım">
      <TeamJoinPanel redirectToPlay />
    </ProjectionFrame>
  );
}
