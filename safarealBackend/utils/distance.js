/**
 * Calculates the geodetic distance between two coordinates in kilometers using the Haversine formula.
 * @param {number} lat1 - Latitude of coordinate 1
 * @param {number} lon1 - Longitude of coordinate 1
 * @param {number} lat2 - Latitude of coordinate 2
 * @param {number} lon2 - Longitude of coordinate 2
 * @returns {number} Distance in kilometers
 */
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 0;
  }
  
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

module.exports = getDistance;
