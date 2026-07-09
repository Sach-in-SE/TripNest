import api from './api';

const TripService = {
    createTrip: async (data) => {
        const res = await api.post('/trips', data);
        return res.data;
    },
    getAllTrips: async () => {
        const res = await api.get('/trips');
        return res.data;
    },
    getTripById: async (id) => {
        const res = await api.get(`/trips/${id}`);
        return res.data;
    },
    updateTrip: async (id, data) => {
        const res = await api.put(`/trips/${id}`, data);
        return res.data;
    },
    deleteTrip: async (id) => {
        const res = await api.delete(`/trips/${id}`);
        return res.data;
    },
    createItinerary: async (data) => {
        const res = await api.post('/itineraries', data);
        return res.data;
    },
    getTripItineraries: async (tripId) => {
        const res = await api.get(`/itineraries/trip/${tripId}`);
        return res.data;
    },
    updateItinerary: async (id, data) => {
        const res = await api.put(`/itineraries/${id}`, data);
        return res.data;
    },
    deleteItinerary: async (id) => {
        const res = await api.delete(`/itineraries/${id}`);
        return res.data;
    },
    createActivity: async (data) => {
        const res = await api.post('/activities', data);
        return res.data;
    },
    getItineraryActivities: async (itineraryId) => {
        const res = await api.get(`/activities/itinerary/${itineraryId}`);
        return res.data;
    },
    deleteActivity: async (id) => {
        const res = await api.delete(`/activities/${id}`);
        return res.data;
    },
};

export default TripService;