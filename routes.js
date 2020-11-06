const fs = require('fs');
const path = require('path');
const routesFolder = path.resolve('./modules');

/**
 * Method to get all module's route paths
 * @returns {Promise} resolve - returns the success state of promise
 * */
const getAllRoutesPath = function () {
  const allRoutesPath = [];
  fs.readdirSync(routesFolder).forEach(file => {
    const fullPath = `${routesFolder}/${file}`;
    if (fs.existsSync(fullPath)) {
      fs.readdirSync(fullPath).forEach(nestedfile => {
        if (nestedfile.includes('route')) {
          const routePath = `${fullPath}/${nestedfile}`.replace('.js', '');
          allRoutesPath.push(routePath);
        }
      });
    }
  });
  return allRoutesPath;
};

/**
 * Method to get all module's route paths
 * @params {class} routerInstance - The express router instance
 * @returns {Promise} resolve - routerInstance return the router with all register routes
 * */
const registerRoutes = function (routerInstance) {
  return new Promise(resolve => {
    const allRoutesPath = getAllRoutesPath();

    // LOAD ALL NESTED ROUTES FILE
    allRoutesPath.map(routeFile => {
      require(routeFile)(routerInstance);
    });

    return resolve(routerInstance);
  });
};

module.exports = {
  registerRoutes
};
