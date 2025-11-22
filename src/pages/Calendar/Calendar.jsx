import { useState, useEffect } from 'react';
import { Layout } from '../../components/Layout/Layout';
import { CalendarModal } from '../../components/CalendarModal/CalendarModal';
import { useAuth } from '../../context/AuthContext';
import { connectWebSocket, disconnectWebSocket, onWebSocketEvent } from '../../services/websocket';
import api from '../../services/api';
import './Calendar.scss';

export const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();

    // Connexion WebSocket pour les mises à jour en temps réel
    if (user?.id) {
      connectWebSocket(user.id);
    }

    // S'abonner aux événements WebSocket
    const unsubscribeEventCreated = onWebSocketEvent('calendar_event_created', () => {
      loadEvents();
    });
    const unsubscribeEventUpdated = onWebSocketEvent('calendar_event_updated', () => {
      loadEvents();
    });
    const unsubscribeEventDeleted = onWebSocketEvent('calendar_event_deleted', () => {
      loadEvents();
    });

    // Recharger toutes les 10 secondes en fallback
    const interval = setInterval(loadEvents, 10000);

    return () => {
      clearInterval(interval);
      unsubscribeEventCreated();
      unsubscribeEventUpdated();
      unsubscribeEventDeleted();
      if (user?.id) {
        disconnectWebSocket();
      }
    };
  }, [user]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const loadedEvents = await api.getCalendarEvents();
      setEvents(loadedEvents);
    } catch (error) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
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

  const handleSaveEvent = async (event) => {
    try {
      if (selectedEvent) {
        // Modifier
        await api.updateCalendarEvent(selectedEvent.id, {
          titre: event.titre,
          description: event.description,
          dateDebut: event.dateDebut,
          dateFin: event.dateFin,
          couleur: event.couleur,
        });
      } else {
        // Créer
        await api.createCalendarEvent({
          titre: event.titre,
          description: event.description,
          dateDebut: event.dateDebut,
          dateFin: event.dateFin,
          couleur: event.couleur,
        });
      }
      await loadEvents();
      setModalOpen(false);
      setSelectedEvent(null);
      setSelectedDate(null);
    } catch (error) {
      alert('Erreur lors de la sauvegarde: ' + (error?.message || 'Erreur serveur'));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.deleteCalendarEvent(eventId);
      await loadEvents();
      setModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      alert('Erreur lors de la suppression: ' + (error?.message || 'Erreur serveur'));
    }
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

