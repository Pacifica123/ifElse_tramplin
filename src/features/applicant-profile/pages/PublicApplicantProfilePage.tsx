import { useParams } from 'react-router-dom';
import { PageStub } from '@/shared/ui/PageStub';

export function PublicApplicantProfilePage() {
  const { id } = useParams();
  return <PageStub title="Публичный профиль соискателя" description={`Профиль пользователя: ${id}`} />;
}
