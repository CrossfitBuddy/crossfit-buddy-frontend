import { App as AntApp, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { ImagePlus } from 'lucide-react'
import { IMAGE_TYPES } from './exerciseValidation'

type ImageUploadProps = Omit<UploadProps, 'beforeUpload' | 'listType' | 'accept'> & {
  label: string
}

export function ImageUpload({ label, maxCount, fileList, ...props }: ImageUploadProps) {
  const { message } = AntApp.useApp()
  const full = maxCount !== undefined && (fileList?.length ?? 0) >= maxCount

  return (
    <Upload
      {...props}
      fileList={fileList}
      maxCount={maxCount}
      listType="picture-card"
      accept=".jpg,.jpeg,.png"
      beforeUpload={(file) => {
        if (IMAGE_TYPES.includes(file.type)) return false
        message.error('Можно загрузить только JPG или PNG')
        return Upload.LIST_IGNORE
      }}
    >
      {!full && (
        <span className="flex flex-col items-center gap-1 text-xs text-stone-500" aria-label={label}>
          <ImagePlus size={20} />
          Добавить
        </span>
      )}
    </Upload>
  )
}
