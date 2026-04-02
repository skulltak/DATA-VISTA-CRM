using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace NexCrm.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public class ChatController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private static string _lastResponse = "No requests yet. Current Time: " + DateTime.UtcNow;

        public ChatController(IConfiguration configuration)
        {
            _configuration = configuration;
            _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(20) };
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? _configuration["OpenAI:ApiKey"];
            return Ok(new { 
                status = "LangChain-style OpenAI Chat API is ready", 
                last_response = _lastResponse,
                key_configured = !string.IsNullOrEmpty(apiKey) && apiKey != "YOUR_OPENAI_API_KEY_HERE"
            });
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] ChatRequest request)
        {
            _lastResponse = "POST reached at " + DateTime.UtcNow + " with message: " + (request?.Message ?? "NULL");

            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_OPENAI_API_KEY_HERE" || apiKey == "REPLACED_WITH_SECURE_ENV_VAR")
            {
                return Ok(new { response = "OpenAI API Key is not configured. Please add the 'OPENAI_API_KEY' environment variable in your Render dashboard." });
            }

            var apiUrl = "https://api.openai.com/v1/chat/completions";

            var payload = new
            {
                model = "gpt-3.5-turbo",
                messages = new[]
                {
                    new { role = "user", content = request.Message }
                },
                temperature = 0.7
            };

            var jsonPayload = JsonSerializer.Serialize(payload);

            try
            {
                // Use HttpRequestMessage to avoid header duplication
                var httpRequest = new HttpRequestMessage(HttpMethod.Post, apiUrl);
                httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
                httpRequest.Content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                var response = await _httpClient.SendAsync(httpRequest);
                var responseString = await response.Content.ReadAsStringAsync();
                _lastResponse = $"OpenAI Status: {response.StatusCode}, Body: {responseString}";

                if (!response.IsSuccessStatusCode)
                {
                    // Return a user-friendly error message instead of a 500
                    return Ok(new { response = $"OpenAI returned an error (HTTP {(int)response.StatusCode}). Please check your API key and billing. Details: {responseString}" });
                }

                using var doc = JsonDocument.Parse(responseString);
                
                if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var firstChoice = choices[0];
                    if (firstChoice.TryGetProperty("message", out var resMessage) && 
                        resMessage.TryGetProperty("content", out var text))
                    {
                        return Ok(new { response = text.GetString() });
                    }
                }

                return Ok(new { response = "OpenAI responded but no text was found." });
            }
            catch (TaskCanceledException)
            {
                _lastResponse = "Timeout calling OpenAI";
                return Ok(new { response = "OpenAI request timed out. Please try again." });
            }
            catch (Exception ex)
            {
                _lastResponse = "Exception in Post: " + ex.Message;
                return Ok(new { response = "AI generation failed: " + ex.Message });
            }
        }
    }

    public class ChatRequest
    {
        [System.Text.Json.Serialization.JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;
    }
}
