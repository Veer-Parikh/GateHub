// Shim: re-exports sonner so legacy imports of '@/hooks/use-toast' still compile.
// All new code should import directly from 'sonner'.
import { toast, useSonner } from "sonner"

export { toast }

// Map useSonner to the useToast name expected by legacy callers
export const useToast = useSonner
