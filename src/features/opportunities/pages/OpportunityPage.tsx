import { useParams } from 'react-router-dom';
import { PageStub } from '@/shared/ui/PageStub';

export function OpportunityPage() {
  const { id } = useParams();

  return (
    <PageStub
      title="Карточка возможности"
      description={`Здесь будет подробная страница возможности. Текущий id: ${id}`}
    />
  );
}
