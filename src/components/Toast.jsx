import { useStore } from '../hooks/useStore'

export default function Toast() {
  const { toast } = useStore()
  return (
    <div className={`toast ${toast.show ? 'show' : ''}`}>
      {toast.msg}
    </div>
  )
}
