import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { CalendarModal } from '../../components/CalendarModal/CalendarModal';
import './Calendar.scss';

export const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('month');

  useEffect(() => {
    loadEvents();

    // Écouter les événements de synchronisation automatique avec debounce
    let timeoutId;
    let isUpdating = false;
    const handleDataSynced = (e) => {
      if (isUpdating) return;
      const customEvent = e;
      if (customEvent.detail?.key === 'monDrive_calendar') {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          try {
            const updated = customEvent.detail.value;
            // Comparer avec l'état actuel pour éviter les re-renders inutiles
            const currentSerialized = JSON.stringify(events);
            const updatedSerialized = JSON.stringify(updated);
            if (updatedSerialized !== currentSerialized) {
              isUpdating = true;
              setEvents(updated);
              setTimeout(() => { isUpdating = false; }, 100);
            }
          } catch (error) {
            console.error('Erreur lors de la synchronisation du calendrier:', error);
          }
        }, 200); // Debounce de 200ms
      }
    };

    window.addEventListener('dataSynced', handleDataSynced);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('dataSynced', handleDataSynced);
    };
  }, [events]); // Dépendance nécessaire pour la comparaison

  const loadEvents = () => {
    try {
      const saved = localStorage.getItem('monDrive_calendar');
      if (saved) {
        setEvents(JSON.parse(saved));
      } else {
        // Exemples d'événements
        const exampleEvents = [
          {
            id: '1',
            titre: 'Réunion équipe',
            description: 'Réunion hebdomadaire pour faire le point sur les projets',
            dateDebut: new Date(Date.now() + 86400000).toISOString(),
            dateFin: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            lieu: 'Salle de réunion A',
            couleur: '#2196f3',
          },
          {
            id: '2',
            titre: 'Deadline projet Alpha',
            description: 'Date limite pour la livraison du projet',
            dateDebut: new Date(Date.now() + 172800000).toISOString(),
            dateFin: new Date(Date.now() + 172800000).toISOString(),
            couleur: '#f44336',
          },
          {
            id: '3',
            titre: 'Formation React',
            description: 'Session de formation sur React 19',
            dateDebut: new Date(Date.now() + 259200000).toISOString(),
            dateFin: new Date(Date.now() + 259200000 + 7200000).toISOString(),
            lieu: 'Salle de formation',
            couleur: '#4caf50',
          },
          {
            id: '4',
            titre: 'Présentation client',
            description: 'Présentation des résultats du trimestre',
            dateDebut: new Date(Date.now() + 345600000).toISOString(),
            dateFin: new Date(Date.now() + 345600000 + 5400000).toISOString(),
            lieu: 'Bureau client',
            couleur: '#ff9800',
          },
        ];
        setEvents(exampleEvents);
        localStorage.setItem('monDrive_calendar', JSON.stringify(exampleEvents));
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const saveEvents = (newEvents) => {
    localStorage.setItem('monDrive_calendar', JSON.stringify(newEvents));
    setEvents(newEvents);
    window.dispatchEvent(new Event('calendarUpdated'));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleSaveEvent = (event) => {
    if (selectedEvent) {
      // Modifier
      const updated = events.map(e => e.id === selectedEvent.id ? event : e);
      saveEvents(updated);
    } else {
      // Créer
      saveEvents([...events, event]);
    }
    setModalOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleDeleteEvent = (eventId) => {
    saveEvents(events.filter(e => e.id !== eventId));
    setModalOpen(false);
    setSelectedEvent(null);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => {
      const eventDate = new Date(e.dateDebut).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <Layout>
      <div className="calendar-page">
        <div className="calendar-header">
          <h1>Calendrier</h1>
          <div className="calendar-controls">
            <button className="btn-secondary" onClick={prevMonth}>←</button>
            <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button className="btn-secondary" onClick={nextMonth}>→</button>
            <button className="btn-primary" onClick={() => {
              setSelectedDate(new Date());
              setSelectedEvent(null);
              setModalOpen(true);
            }}>
              + Nouvel événement
            </button>
          </div>
        </div>

        <div className="calendar-container">
          <div className="calendar-grid">
            {dayNames.map(day => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}
            {days.map((date, index) => {
              const dayEvents = date ? getEventsForDate(date) : [];
              const isToday = date && date.toDateString() === new Date().toDateString();
              return (
                <div
                  key={index}
                  className={`calendar-day ${!date ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => date && handleDateClick(date)}
                >
                  {date && (
                    <>
                      <div className="calendar-day-number">{date.getDate()}</div>
                      <div className="calendar-day-events">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className="calendar-event"
                            style={{ backgroundColor: event.couleur || '#2196f3' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            {event.titre}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="calendar-event-more">+{dayEvents.length - 3}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {modalOpen && (
          <CalendarModal
            event={selectedEvent}
            date={selectedDate}
            onClose={() => {
              setModalOpen(false);
              setSelectedEvent(null);
              setSelectedDate(null);
            }}
            onSave={handleSaveEvent}
            onDelete={selectedEvent ? () => handleDeleteEvent(selectedEvent.id) : undefined}
          />
        )}
      </div>
    </Layout>
  );
};

