import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  const plateColor = '#ededed';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#171717',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 5, height: 18, background: plateColor, borderRadius: 1 }} />
          <div style={{ width: 2, height: 10, background: plateColor }} />
          <div style={{ width: 14, height: 4, background: plateColor }} />
          <div style={{ width: 2, height: 10, background: plateColor }} />
          <div style={{ width: 5, height: 18, background: plateColor, borderRadius: 1 }} />
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
