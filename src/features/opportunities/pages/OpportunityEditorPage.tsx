import { useParams } from 'react-router-dom';
import { PageStub } from '@/shared/ui/PageStub';

export function OpportunityEditorPage() {
  const { id } = useParams();
  const mode = id ? 'Редактирование возможности' : 'Создание возможности';

  return <PageStub title={mode} description="Здесь будет форма создания/редактирования." />;
}
