// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

// ... (El resto del contenido del hook que gestiona el estado de los toasts)
// Por simplicidad, nos centraremos en la exportación principal.

let count = 0

function genId() {
  count = (count + 1) % 1e6
  return count.toString()
}

type Toast = Omit<ToasterToast, "id">

const toast = (props: Toast) => {
  // La implementación completa del despachador de toasts iría aquí.
  // Por ahora, lo importante es que la función exista.
}

function useToast() {
  // La implementación completa del hook iría aquí.
  return { toast }
}

export { useToast, toast }