export function CuratorStubNotice() {
  return (
    <div
      style={{
        background: '#fff7e6',
        color: '#935c00',
        border: '1px solid #f5d37a',
        borderRadius: 18,
        padding: '14px 16px',
        lineHeight: 1.5,
      }}
    >
      Кураторская зона сейчас работает на фронтовых заглушках с сохранением в <code>localStorage</code>.
      Как только на бэке появятся curator API, этот слой можно будет заменить без полной переделки страниц.
    </div>
  );
}
