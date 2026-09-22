-- RemodelAI 3D — relational schema for SQL Server.
-- Run once via: sqlcmd -S localhost,1433 -E -v AppPassword="<password>" -i server/db/schema.sql
-- Uses a trusted (Windows) connection to provision the database and a dedicated,
-- least-privilege SQL login (`remodelai_app`) that the Node app connects with at runtime.

IF DB_ID('RemodelAI3D') IS NULL
BEGIN
    CREATE DATABASE RemodelAI3D;
END
GO

USE RemodelAI3D;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'remodelai_app')
BEGIN
    DECLARE @sql NVARCHAR(MAX) = N'CREATE LOGIN remodelai_app WITH PASSWORD = ''' + REPLACE('$(AppPassword)', '''', '''''') + N''', CHECK_POLICY = OFF;';
    EXEC sp_executesql @sql;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'remodelai_app')
BEGIN
    CREATE USER remodelai_app FOR LOGIN remodelai_app;
    ALTER ROLE db_owner ADD MEMBER remodelai_app;
END
GO

-- ==========================================
-- USERS
-- ==========================================
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id               NVARCHAR(64)   NOT NULL PRIMARY KEY,
        Name             NVARCHAR(200)  NOT NULL,
        Email            NVARCHAR(255)  NOT NULL,
        Role             NVARCHAR(20)   NOT NULL DEFAULT 'user',
        EmailVerified    BIT            NOT NULL DEFAULT 0,
        Status           NVARCHAR(30)   NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
        PasswordHash     NVARCHAR(255)  NULL,
        Salt             NVARCHAR(64)   NULL,
        VerificationCode NVARCHAR(10)   NULL,
        AvatarUrl        NVARCHAR(500)  NULL,
        CreatedAt        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        LastLoginAt      DATETIME2      NULL,
        CONSTRAINT UQ_Users_Email UNIQUE (Email)
    );
END
GO

-- ==========================================
-- SESSIONS
-- ==========================================
IF OBJECT_ID('dbo.Sessions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sessions (
        Token     NVARCHAR(128) NOT NULL PRIMARY KEY,
        UserId    NVARCHAR(64)  NOT NULL,
        CreatedAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        ExpiresAt DATETIME2     NOT NULL,
        CONSTRAINT FK_Sessions_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Sessions_UserId ON dbo.Sessions(UserId);
END
GO

-- ==========================================
-- PROJECTS
-- ==========================================
IF OBJECT_ID('dbo.Projects', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Projects (
        Id           NVARCHAR(64)   NOT NULL PRIMARY KEY,
        OwnerId      NVARCHAR(64)   NOT NULL,
        OwnerName    NVARCHAR(200)  NOT NULL,
        Name         NVARCHAR(200)  NOT NULL,
        Description  NVARCHAR(1000) NULL,
        Status       NVARCHAR(20)   NOT NULL DEFAULT 'active',
        Version      INT            NOT NULL DEFAULT 1,
        ThumbnailUrl NVARCHAR(500)  NULL,
        CreatedAt    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        DeletedAt    DATETIME2      NULL,
        CONSTRAINT FK_Projects_Users FOREIGN KEY (OwnerId) REFERENCES dbo.Users(Id)
    );
    CREATE INDEX IX_Projects_OwnerId ON dbo.Projects(OwnerId) INCLUDE (DeletedAt);
END
GO

-- ==========================================
-- SCENES (one active scene per project)
-- ==========================================
IF OBJECT_ID('dbo.Scenes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Scenes (
        Id              NVARCHAR(64)  NOT NULL PRIMARY KEY,
        ProjectId       NVARCHAR(64)  NOT NULL,
        Version         INT           NOT NULL DEFAULT 1,
        Width           FLOAT         NOT NULL,
        Length          FLOAT         NOT NULL,
        Height          FLOAT         NOT NULL,
        WallMaterial    NVARCHAR(30)  NOT NULL DEFAULT 'pintura',
        WallColor       NVARCHAR(20)  NOT NULL DEFAULT '#f1f5f9',
        FloorMaterial   NVARCHAR(30)  NOT NULL DEFAULT 'madera',
        FloorColor      NVARCHAR(20)  NOT NULL DEFAULT '#a16207',
        CeilingColor    NVARCHAR(20)  NOT NULL DEFAULT '#ffffff',
        CeilingVisible  BIT           NOT NULL DEFAULT 0,
        LightingPreset  NVARCHAR(20)  NOT NULL DEFAULT 'dia',
        CameraDataJson  NVARCHAR(MAX) NULL,
        CreatedAt       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt       DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Scenes_Projects FOREIGN KEY (ProjectId) REFERENCES dbo.Projects(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_Scenes_ProjectId UNIQUE (ProjectId)
    );
END
GO

-- ==========================================
-- SCENE OBJECTS (furniture / structural items)
-- ==========================================
IF OBJECT_ID('dbo.SceneObjects', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SceneObjects (
        Id             NVARCHAR(64)  NOT NULL PRIMARY KEY,
        SceneId        NVARCHAR(64)  NOT NULL,
        LibraryAssetId NVARCHAR(64)  NULL,
        Name           NVARCHAR(200) NOT NULL,
        Category       NVARCHAR(30)  NOT NULL,
        Type           NVARCHAR(30)  NOT NULL,
        PosX           FLOAT         NOT NULL DEFAULT 0,
        PosY           FLOAT         NOT NULL DEFAULT 0,
        PosZ           FLOAT         NOT NULL DEFAULT 0,
        RotX           FLOAT         NOT NULL DEFAULT 0,
        RotY           FLOAT         NOT NULL DEFAULT 0,
        RotZ           FLOAT         NOT NULL DEFAULT 0,
        ScaleX         FLOAT         NOT NULL DEFAULT 1,
        ScaleY         FLOAT         NOT NULL DEFAULT 1,
        ScaleZ         FLOAT         NOT NULL DEFAULT 1,
        Color          NVARCHAR(20)  NOT NULL DEFAULT '#cbd5e1',
        Material       NVARCHAR(40)  NOT NULL DEFAULT 'estandar',
        Roughness      FLOAT         NULL,
        Metalness      FLOAT         NULL,
        Visible        BIT           NOT NULL DEFAULT 1,
        Locked         BIT           NOT NULL DEFAULT 0,
        CONSTRAINT FK_SceneObjects_Scenes FOREIGN KEY (SceneId) REFERENCES dbo.Scenes(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_SceneObjects_SceneId ON dbo.SceneObjects(SceneId);
END
GO

-- ==========================================
-- SHARE LINKS
-- ==========================================
IF OBJECT_ID('dbo.ShareLinks', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ShareLinks (
        Id          NVARCHAR(64)  NOT NULL PRIMARY KEY,
        ProjectId   NVARCHAR(64)  NOT NULL,
        ProjectName NVARCHAR(200) NOT NULL,
        CreatedBy   NVARCHAR(64)  NOT NULL,
        CreatorName NVARCHAR(200) NOT NULL,
        Token       NVARCHAR(120) NOT NULL,
        TokenHash   NVARCHAR(255) NOT NULL,
        IsActive    BIT           NOT NULL DEFAULT 1,
        AccessCount INT           NOT NULL DEFAULT 0,
        ExpiresAt   DATETIME2     NULL,
        CreatedAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        RevokedAt   DATETIME2     NULL,
        CONSTRAINT FK_ShareLinks_Projects FOREIGN KEY (ProjectId) REFERENCES dbo.Projects(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_ShareLinks_Token UNIQUE (Token)
    );
END
GO

-- ==========================================
-- AUDIT LOGS (append-only)
-- ==========================================
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLogs (
        Id         NVARCHAR(64)  NOT NULL PRIMARY KEY,
        UserId     NVARCHAR(64)  NOT NULL,
        UserName   NVARCHAR(200) NOT NULL,
        UserEmail  NVARCHAR(255) NULL,
        Action     NVARCHAR(30)  NOT NULL,
        EntityType NVARCHAR(30)  NOT NULL,
        EntityId   NVARCHAR(120) NOT NULL,
        Status     NVARCHAR(20)  NOT NULL,
        Metadata   NVARCHAR(MAX) NULL,
        CreatedAt  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_AuditLogs_CreatedAt ON dbo.AuditLogs(CreatedAt DESC);
END
GO

-- ==========================================
-- EXPORT RECORDS
-- ==========================================
IF OBJECT_ID('dbo.ExportRecords', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ExportRecords (
        Id             NVARCHAR(64)  NOT NULL PRIMARY KEY,
        ProjectId      NVARCHAR(64)  NOT NULL,
        ProjectName    NVARCHAR(200) NOT NULL,
        UserId         NVARCHAR(64)  NOT NULL,
        Format         NVARCHAR(10)  NOT NULL,
        Resolution     NVARCHAR(10)  NOT NULL,
        Status         NVARCHAR(20)  NOT NULL,
        FileUrl        NVARCHAR(500) NULL,
        FileSizeMb     FLOAT         NULL,
        CameraPreset   NVARCHAR(20)  NOT NULL,
        LightingPreset NVARCHAR(20)  NOT NULL,
        CreatedAt      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_ExportRecords_CreatedAt ON dbo.ExportRecords(CreatedAt DESC);
END
GO

-- ==========================================
-- APP COUNTERS (simple key/value counters, e.g. aiGenerationsCount)
-- ==========================================
IF OBJECT_ID('dbo.AppCounters', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AppCounters (
        Name  NVARCHAR(60) NOT NULL PRIMARY KEY,
        Value INT          NOT NULL DEFAULT 0
    );
END
GO
