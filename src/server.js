import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { z } from 'zod';
    import { cities, searchCities, getWeather } from './weather-data.js';

    // Create an MCP server for weather information
    const server = new McpServer({
      name: "Weather Service",
      version: "1.0.0",
      description: "An MCP server providing weather information for cities around the world"
    });

    // Add a weather resource to get weather by city
    server.resource(
      "weather", 
      new ResourceTemplate("weather://{city}", { list: undefined }),
      async (uri, { city }) => {
        const weatherData = getWeather(city);
        
        if (!weatherData) {
          return {
            contents: [{
              uri: uri.href,
              text: `Weather information for ${city} not found. Try using the search_cities tool to find available cities.`
            }]
          };
        }
        
        return {
          contents: [{
            uri: uri.href,
            text: `Weather in ${city.charAt(0).toUpperCase() + city.slice(1)}:
Temperature: ${weatherData.temp}°F
Condition: ${weatherData.condition}
Humidity: ${weatherData.humidity}%
Country: ${weatherData.country}`
          }]
        };
      }
    );
    
    // Add a "get weather" tool
    server.tool(
      "get_weather",
      { city: z.string().describe("Name of the city to get weather for") },
      async ({ city }) => {
        const weatherData = getWeather(city);
        
        if (!weatherData) {
          return {
            content: [{ 
              type: "text", 
              text: `Weather information for ${city} not found. Try using the search_cities tool to find available cities.` 
            }],
            isError: true
          };
        }
        
        return {
          content: [{ 
            type: "text", 
            text: `Weather in ${city.charAt(0).toUpperCase() + city.slice(1)}:
Temperature: ${weatherData.temp}°F
Condition: ${weatherData.condition}
Humidity: ${weatherData.humidity}%
Country: ${weatherData.country}` 
          }]
        };
      },
      { description: "Get current weather information for a specific city" }
    );

    // Add a "search cities" tool
    server.tool(
      "search_cities",
      { query: z.string().describe("Partial name of the city to search for") },
      async ({ query }) => {
        const results = searchCities(query);
        
        if (results.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: `No cities found matching "${query}". Try a different search term.` 
            }]
          };
        }
        
        const formattedResults = results.map(city => 
          `${city.name.charAt(0).toUpperCase() + city.name.slice(1)} (${city.country})`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `Cities matching "${query}":\n${formattedResults}` 
          }]
        };
      },
      { description: "Search for cities by partial name" }
    );

    // Add a "list all cities" tool
    server.tool(
      "list_all_cities",
      {},
      async () => {
        const cityList = Object.entries(cities).map(([name, data]) => 
          `${name.charAt(0).toUpperCase() + name.slice(1)} (${data.country})`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `Available cities:\n${cityList}` 
          }]
        };
      },
      { description: "List all available cities in the database" }
    );

    // Add a forecast tool (simplified with mock data)
    server.tool(
      "get_forecast",
      { 
        city: z.string().describe("Name of the city to get forecast for"),
        days: z.number().min(1).max(5).default(3).describe("Number of days for forecast (1-5)")
      },
      async ({ city, days }) => {
        const weatherData = getWeather(city);
        
        if (!weatherData) {
          return {
            content: [{ 
              type: "text", 
              text: `Weather information for ${city} not found. Try using the search_cities tool to find available cities.` 
            }],
            isError: true
          };
        }
        
        // Generate mock forecast based on current conditions
        const forecast = [];
        const conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Thunderstorms", "Clear"];
        const baseTemp = weatherData.temp;
        
        for (let i = 1; i <= days; i++) {
          const tempVariation = Math.floor(Math.random() * 10) - 5; // -5 to +5 degrees
          const randomConditionIndex = Math.floor(Math.random() * conditions.length);
          
          forecast.push({
            day: i,
            temp: baseTemp + tempVariation,
            condition: conditions[randomConditionIndex]
          });
        }
        
        const formattedForecast = forecast.map(day => 
          `Day ${day.day}: ${day.temp}°F, ${day.condition}`
        ).join('\n');
        
        return {
          content: [{ 
            type: "text", 
            text: `${days}-day forecast for ${city.charAt(0).toUpperCase() + city.slice(1)}:\n${formattedForecast}` 
          }]
        };
      },
      { description: "Get a weather forecast for a specific city" }
    );

    export { server };
