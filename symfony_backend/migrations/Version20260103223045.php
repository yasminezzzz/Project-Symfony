<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260103223045 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE student_group ADD test_id INT NOT NULL, ADD student_id INT NOT NULL, DROP min_score, DROP max_score');
        $this->addSql('ALTER TABLE student_group ADD CONSTRAINT FK_E5F73D581E5D0459 FOREIGN KEY (test_id) REFERENCES test (id)');
        $this->addSql('ALTER TABLE student_group ADD CONSTRAINT FK_E5F73D58CB944F1A FOREIGN KEY (student_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_E5F73D581E5D0459 ON student_group (test_id)');
        $this->addSql('CREATE INDEX IDX_E5F73D58CB944F1A ON student_group (student_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE student_group DROP FOREIGN KEY FK_E5F73D581E5D0459');
        $this->addSql('ALTER TABLE student_group DROP FOREIGN KEY FK_E5F73D58CB944F1A');
        $this->addSql('DROP INDEX IDX_E5F73D581E5D0459 ON student_group');
        $this->addSql('DROP INDEX IDX_E5F73D58CB944F1A ON student_group');
        $this->addSql('ALTER TABLE student_group ADD min_score INT NOT NULL, ADD max_score INT NOT NULL, DROP test_id, DROP student_id');
    }
}
