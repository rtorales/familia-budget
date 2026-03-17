'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Camera,
  BarChart3,
  Settings,
  Wallet
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Resumen', icon: LayoutDashboard },
  { href: '/gastos', label: 'Gastos', icon: TrendingDown },
  { href: '/ingresos', label: 'Ingresos', icon: TrendingUp },
  { href: '/cuotas', label: 'Cuotas', icon: CreditCard },
  { href: '/presupuestos', label: 'Presupuestos', icon: Wallet },
  { href: '/escaner', label: 'Escanear Ticket', icon: Camera },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">FamiliaBudget</h1>
            <p className="text-xs text-gray-500">Los García</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Family members */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Miembros</p>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">C</div>
            <span className="text-xs text-gray-600">Carlos</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <div className="w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold">L</div>
            <span className="text-xs text-gray-600">Laura</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
