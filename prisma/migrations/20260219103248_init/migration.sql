-- CreateTable
CREATE TABLE "FrpEndpoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "assignedPort" INTEGER NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'My Remote LLM',
    "modelName" TEXT NOT NULL DEFAULT 'default',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrpEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FrpEndpoint_token_key" ON "FrpEndpoint"("token");

-- CreateIndex
CREATE UNIQUE INDEX "FrpEndpoint_assignedPort_key" ON "FrpEndpoint"("assignedPort");

-- CreateIndex
CREATE INDEX "FrpEndpoint_userId_idx" ON "FrpEndpoint"("userId");

-- AddForeignKey
ALTER TABLE "FrpEndpoint" ADD CONSTRAINT "FrpEndpoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
