<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260106213914 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE course ADD group_id INT NOT NULL, ADD title VARCHAR(255) NOT NULL, ADD type VARCHAR(50) NOT NULL, ADD file_path VARCHAR(500) NOT NULL, ADD created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE course ADD CONSTRAINT FK_169E6FB9FE54D947 FOREIGN KEY (group_id) REFERENCES student_group (id)');
        $this->addSql('CREATE INDEX IDX_169E6FB9FE54D947 ON course (group_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE course DROP FOREIGN KEY FK_169E6FB9FE54D947');
        $this->addSql('DROP INDEX IDX_169E6FB9FE54D947 ON course');
        $this->addSql('ALTER TABLE course DROP group_id, DROP title, DROP type, DROP file_path, DROP created_at');
    }
}
