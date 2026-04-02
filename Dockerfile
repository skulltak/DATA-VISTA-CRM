# Use the official ASP.NET Core runtime as a base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

# Use the official .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["NexCrm.Api/NexCrm.Api.csproj", "NexCrm.Api/"]
RUN dotnet restore "NexCrm.Api/NexCrm.Api.csproj"
COPY . .
WORKDIR "/src/NexCrm.Api"
RUN dotnet build "NexCrm.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "NexCrm.Api.csproj" -c Release -o /app/publish

# Copy the build output to the runtime image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "NexCrm.Api.dll"]
