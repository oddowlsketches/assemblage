import React, { useState, useEffect } from 'react'
import { CaretDown, Check } from 'phosphor-react'
import { Listbox } from '@headlessui/react'
import { getSupabase } from '../supabaseClient'

export const SourceSelector = ({ 
  activeSource,
  activeSourceName,
  onSourceChange,
  userCollections,
  className 
}) => {
  const [session, setSession] = useState(null)
  
  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      setSession(user)
    }
    checkSession()
  }, [])

  const getSourceLabel = () => {
    // Always use the activeSourceName prop passed from parent
    return activeSourceName || 'Select Collection'
  }

  const handleSourceSelect = (sourceId) => {
    onSourceChange(sourceId)
  }

  // Transform collections for Listbox options
  const listboxOptions = userCollections?.map(collection => {
    const isDefaultCollection = collection.id === '00000000-0000-0000-0000-000000000001'
    return {
      id: isDefaultCollection ? 'cms' : collection.id,
      name: collection.name,
      originalId: collection.id
    }
  }) || []

  // Find the selected option for Listbox
  const selectedOption = listboxOptions.find(option => option.id === activeSource) || 
    (listboxOptions.length > 0 ? listboxOptions[0] : { id: 'cms', name: 'Default Library' })

  return (
    <div className={className}>
      {/* Library Selector with Headless UI Listbox */}
      <Listbox value={selectedOption} onChange={(option) => handleSourceSelect(option.id)}>
        <div className="relative">
          <Listbox.Button 
            className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            style={{ 
              justifyContent: 'space-between',
              paddingLeft: '1rem',
              paddingRight: '0.75rem',
              backgroundColor: 'white',
              color: '#333',
              border: '1px solid #333',
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
              {getSourceLabel()}
            </span>
            <CaretDown size={12} weight="regular" />
          </Listbox.Button>
          
          <Listbox.Options className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white shadow-lg focus:outline-none">
            {listboxOptions.map((option) => (
              <Listbox.Option
                key={option.id}
                value={option}
                className={({ active, selected }) =>
                  `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                    active ? 'bg-gray-100' : ''
                  } ${selected ? 'bg-gray-50' : ''}`
                }
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                      {option.name}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Check size={16} weight="bold" />
                      </span>
                    )}
                  </>
                )}
              </Listbox.Option>
            ))}
            
            {/* Educational text for signed-out users */}
            {!session && listboxOptions.length === 1 && (
              <div className="px-3 py-3 text-xs text-gray-500 italic bg-gray-50">
                Sign in to upload your own images
              </div>
            )}
          </Listbox.Options>
        </div>
      </Listbox>
    </div>
  )
}
