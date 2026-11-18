import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from 'antd'
import { useState } from 'react'
import type { UploadFile } from 'antd'
import { afterEach, expect, it, vi } from 'vitest'
import { ImageUpload } from './ImageUpload'
import { downloadMedia, uploadMedia } from './mediaApi'

vi.mock('./mediaApi', () => ({ downloadMedia: vi.fn(), uploadMedia: vi.fn() }))
afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals() })

function Form() {
  const [files, setFiles] = useState<UploadFile[]>([])
  return <App><ImageUpload label="Картинка" fileList={files} onChange={event => setFiles(event.fileList)} /></App>
}

it('показывает новую картинку локально и не запрашивает download-url для PENDING', async () => {
  URL.createObjectURL = vi.fn(() => 'blob:local')
  URL.revokeObjectURL = vi.fn()
  vi.mocked(uploadMedia).mockResolvedValue('pending-id')
  const view = render(<Form />)
  fireEvent.change(screen.getByLabelText('Картинка'), { target: {
    files: [new File(['image'], 'a.png', { type: 'image/png' })],
  } })
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  expect(screen.getByAltText('Изображение')).toHaveAttribute('src', 'blob:local')
  expect(downloadMedia).not.toHaveBeenCalled()
  view.unmount()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:local')
})

it('игнорирует результат старой загрузки после замены файла', async () => {
  URL.createObjectURL = vi.fn(() => 'blob:local')
  URL.revokeObjectURL = vi.fn()
  let finishOld!: (id: string) => void
  vi.mocked(uploadMedia).mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve }))
    .mockResolvedValueOnce('new-id')
  render(<Form />)
  const input = screen.getByLabelText('Картинка')
  fireEvent.change(input, { target: { files: [new File(['a'], 'a.png', { type: 'image/png' })] } })
  const signal = vi.mocked(uploadMedia).mock.calls[0][1]
  fireEvent.change(input, { target: { files: [new File(['b'], 'b.png', { type: 'image/png' })] } })
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
  await act(async () => finishOld('old-id'))
  expect(signal.aborted).toBe(true)
  expect(screen.getByText('b.png')).toBeInTheDocument()
  expect(screen.queryByText('a.png')).not.toBeInTheDocument()
})

it('обновляет истёкшую ссылку просмотра сохранённого файла', async () => {
  vi.useFakeTimers()
  vi.mocked(downloadMedia).mockResolvedValueOnce({
    downloadUrl: '/first.png', expiresAt: new Date(Date.now() + 1000).toISOString(),
  }).mockResolvedValue({
    downloadUrl: '/second.png', expiresAt: new Date(Date.now() + 60000).toISOString(),
  })
  const view = render(<App><ImageUpload label="Сохранённая картинка" fileList={[
    { uid: 'saved', name: 'saved.png', status: 'done', response: { fileId: 'saved' } },
  ]} /></App>)
  await act(async () => { await vi.advanceTimersByTimeAsync(0) })
  expect(screen.getByAltText('Изображение')).toHaveAttribute('src', '/first.png')
  await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  expect(screen.getByAltText('Изображение')).toHaveAttribute('src', '/second.png')
  expect(downloadMedia).toHaveBeenCalledTimes(2)
  view.unmount()
  vi.useRealTimers()
})
