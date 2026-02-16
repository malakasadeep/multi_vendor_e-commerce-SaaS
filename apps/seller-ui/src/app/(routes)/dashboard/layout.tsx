import React from 'react'
import SideBarWrapper from '../../shared/components/sidebar/sidebat'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full bg-black min-h-screen">
      <aside>
        <div>
          <SideBarWrapper />
        </div>
      </aside>

      <main className='flex-1'>
        <div className='overflow-auto'>
          {children}
        </div>

      </main>
    </div>
  )
}

export default Layout