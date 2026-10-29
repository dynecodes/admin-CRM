import React, { useEffect, useRef } from 'react';
import { Card, Badge, Button } from 'flowbite-react';

interface MobileCardField {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'badges' | 'currency' | 'duration';
  color?: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface MobileCardAction {
  label: string;
  color: string;
  icon?: React.ReactNode;
  onClick: (item: any) => void;
  triggerInlineEdit?: boolean;
}

interface MobileCardConfig {
  titleField: string;
  titleRender?: (item: any) => React.ReactNode;
  subtitleRender?: (item: any) => React.ReactNode;
  statusField?: string;
  fields?: MobileCardField[];
  actions?: MobileCardAction[];
  enableEdit?: boolean;
}

interface MobileCardsProps {
  paginatedData: any[];
  noDataMessage: string;
  mobileCard?: MobileCardConfig;
  enableInlineEdit: boolean;
  editingId: any;
  handleMobileCardClick: (item: any) => void;
  renderEditForm?: (item: any, onSave: (data: any) => void, onCancel: () => void) => React.ReactNode;
  handleEditSave: (data: any) => void;
  handleEditCancel: () => void;
}

const MobileCards: React.FC<MobileCardsProps> = ({
  paginatedData,
  noDataMessage,
  mobileCard,
  enableInlineEdit,
  editingId,
  handleMobileCardClick,
  renderEditForm,
  handleEditSave,
  handleEditCancel
}) => {
  const editFormRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // auto scroll when edit form appears
  useEffect(() => {
    if (editingId && editFormRefs.current[editingId]) {
      const editElement = editFormRefs.current[editingId];
      if (editElement) {
        setTimeout(() => {
          editElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 100);
      }
    }
  }, [editingId]);

  return (
    <div className="lg:hidden space-y-4">
      {paginatedData.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <p className="text-lg font-medium">{noDataMessage}</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        paginatedData.map((item, index) => (
          <div key={item.id || index}>
            {mobileCard ? (
              <Card 
                className={`w-full transition-all duration-200 ${
                  enableInlineEdit && mobileCard.enableEdit ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${
                  editingId === item.id ? 'border-4 border-gray-500' : ''
                }`}
                onClick={() => enableInlineEdit && mobileCard.enableEdit ? handleMobileCardClick(item) : undefined}
                ref={(el) => {
                  if (editingId === item.id) {
                    editFormRefs.current[item.id] = el as HTMLElement;
                  }
                }}
              >
                <div className="flex justify-between items-start mb-0">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {mobileCard.titleRender ? mobileCard.titleRender(item) : item[mobileCard.titleField]}
                    </h3>
                    {mobileCard.subtitleRender && (
                      <div className="text-base font-bold text-gray-600 mb-2">
                        {mobileCard.subtitleRender(item)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-gray-600  mb-1 text-[14px]">
                  {mobileCard.fields?.map((field, fieldIndex) => {
                    let value = item[field.key];
                    
                    if (field.render) {
                      const rendered = field.render(value, item);
                      if (!rendered) return null;
                      return (
                        <div key={fieldIndex} className="flex gap-2">
                          <span className="font-bold  ">{field.label}:</span>
                          <span className='font-medium text-sm '>{rendered}</span>
                        </div>
                      );
                      
                    }

                    if (!value || (Array.isArray(value) && value.length === 0)) return null;

                    if (field.type === 'badges' && Array.isArray(value)) {
                      return (
                        <div key={fieldIndex}>
                          <span className="font-bold">{field.label}:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {value.map((badge, badgeIndex) => (
                              <Badge key={badgeIndex} color={field.color || 'gray'} size="sm">
                                {typeof badge === 'object' ? badge.name : badge}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={fieldIndex} className="flex gap-2">
                        <span className="font-bold">{field.label}:</span>
                        <span className='font-medium'>{value}</span>
                      </div>
                    );
                  })}
                </div>

                {mobileCard.actions && mobileCard.actions.length > 0 && editingId !== item.id && (
                  <div className="pt-2 border-t border-gray-200">
                    {mobileCard.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        size="xs"
                        color={action.color}
                        onClick={(e) => {
                          e.stopPropagation();
                          // If action explicitly wants inline edit, trigger it
                          if (action.triggerInlineEdit && renderEditForm) {
                            handleMobileCardClick(item);
                          } else {
                            // Otherwise use the action's onClick
                            action.onClick(item);
                          }
                        }}
                        className="w-full cursor-pointer"
                      >
                        {action.icon && <span className="mr-1">{action.icon}</span>}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {enableInlineEdit && mobileCard?.enableEdit && editingId === item.id && renderEditForm && (
                  <div 
                    className="pt-3 border-t-2 border-gray-300 mt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderEditForm(item, handleEditSave, handleEditCancel)}
                  </div>
                )}
              </Card>
            ) : (
              <div className="p-4 bg-white border border-gray-200 rounded-md">
                <p className="text-sm text-gray-500">Mobile card not configured</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MobileCards;