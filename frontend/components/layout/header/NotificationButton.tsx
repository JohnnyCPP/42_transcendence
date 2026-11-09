import { InfoDialog } from "@/components/ui";
import { useState } from "react";
// Notificación visual temporal hasta que exista el flujo real.
export function NotificationButton() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
  
	return (
	  <>
		<button
		  onClick={() => setIsDialogOpen(true)}
		  className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center relative cursor-pointer"
		  title="Notificaciones"
		>
		  <span className="material-symbols-outlined">notifications</span>
		  <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full" />
		</button>
  
		<InfoDialog
		  isOpen={isDialogOpen}
		  title="Notificaciones pendientes"
		  description="La bandeja de notificaciones todavía no está implementada en el frontend."
		  onClose={() => setIsDialogOpen(false)}
		/>
	  </>
	);
  }