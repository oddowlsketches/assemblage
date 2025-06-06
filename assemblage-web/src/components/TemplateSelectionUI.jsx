// Template selection UI component for both mobile and desktop
const TemplateSelectionUI = ({ 
  templateMode, 
  localSelectedTemplates, 
  uniqueTemplates, 
  templateCategories, 
  uiColors, 
  handleTemplateToggle, 
  setLocalSelectedTemplates,
  isMobile,
  templateDisplayNames = {} 
}) => {
  if (templateMode !== 'custom') return null;

  return (
    <div style={{
      backgroundColor: '#f9f9f9',
      border: `1px solid #e0e0e0`,
      borderRadius: '4px',
      marginTop: '-0.5rem',
      overflow: 'hidden'
    }}>
      {/* Action buttons */}
      <div style={{
        padding: '0.75rem 1rem',
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5'
      }}>
        <button
          onClick={() => setLocalSelectedTemplates(uniqueTemplates.map(t => t.key))}
          style={{
            padding: '0.4rem 0.75rem',
            backgroundColor: 'white',
            color: uiColors.fg,
            border: `1px solid ${uiColors.border}`,
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.8rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = uiColors.fg;
            e.target.style.color = uiColors.bg;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.color = uiColors.fg;
          }}
        >
          Select All
        </button>
        {localSelectedTemplates.length > 0 && (
          <button
            onClick={() => setLocalSelectedTemplates([])}
            style={{
              padding: '0.4rem 0.75rem',
              backgroundColor: 'white',
              color: uiColors.fg,
              border: `1px solid ${uiColors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.8rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = uiColors.fg;
              e.target.style.color = uiColors.bg;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = uiColors.fg;
            }}
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Template categories */}
      <div style={{ 
        padding: '1rem',
        maxHeight: isMobile ? '300px' : '400px',
        overflowY: 'auto'
      }}>
        {Object.entries(templateCategories).map(([category, categoryTemplates]) => {
          const visibleTemplates = categoryTemplates.filter(key => 
            uniqueTemplates.some(t => t.key === key)
          );
          if (visibleTemplates.length === 0) return null;
          
          return (
            <div key={category} style={{ marginBottom: '1.5rem' }}>
              <h4 style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                color: '#666',
                marginBottom: '0.5rem',
                fontWeight: 'normal',
                letterSpacing: '0.05em',
                fontFamily: 'Space Mono, monospace'
              }}>
                {category}
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                {visibleTemplates.map(templateKey => {
                  const template = uniqueTemplates.find(t => t.key === templateKey);
                  if (!template) return null;
                  const isSelected = localSelectedTemplates.includes(template.key);
                  
                  return (
                    <button
                      key={template.key}
                      onClick={() => handleTemplateToggle(template.key)}
                      style={{
                        padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                        backgroundColor: isSelected ? uiColors.fg : 'white',
                        color: isSelected ? uiColors.bg : uiColors.fg,
                        border: `1px solid ${isSelected ? uiColors.fg : '#ddd'}`,
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontFamily: 'Space Mono, monospace',
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.backgroundColor = '#f5f5f5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.backgroundColor = 'white';
                        }
                      }}
                      title={template.description || templateDisplayNames[template.key] || template.name || template.key}
                    >
                      {templateDisplayNames[template.key] || template.name || template.key}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {localSelectedTemplates.length === 0 && (
        <div style={{ 
          margin: '0 1rem 1rem 1rem',
          padding: '0.75rem',
          backgroundColor: '#fff8dc',
          border: '1px solid #f0e68c',
          borderRadius: '4px',
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: '#856404',
          fontFamily: 'Space Mono, monospace'
        }}>
          Please select at least one template
        </div>
      )}
    </div>
  );
};

export { TemplateSelectionUI };
