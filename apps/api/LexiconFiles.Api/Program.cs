using LexiconFiles.Api.Endpoints;

const string WebClientCorsPolicy = "WebClient";

var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
    options.AddPolicy(WebClientCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(WebClientCorsPolicy);
app.MapHealthEndpoints();

app.Run();

public partial class Program;
