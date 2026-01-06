import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Bell } from 'lucide-react'

const Notification = () => {
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className='border bg-white p-1 rounded-md w-[36px] h-[36px] flex items-center justify-center cursor-pointer'><Bell size={16} /> </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className='p-2 items-center flex justify-center'>
          <div className='bg-white w-[300px] flex justify-center items-center p-4 border border-gray-200 rounded-md'>
            <p className='text-gray-500 text-sm'>You have no notifications!</p>
          </div>

        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  )
}

export default Notification
