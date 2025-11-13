import React from 'react'
import { TrashList } from '@/components/projects/trash'

export const dynamic = 'force-dynamic'

const TrashPage = async () => {
  return (
    <div className="container mx-auto py-36">
      <TrashList />
    </div>
  )
}

export default TrashPage

