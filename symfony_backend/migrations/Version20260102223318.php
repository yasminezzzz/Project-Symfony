<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260102223318 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE test ADD tutor_id INT NOT NULL, CHANGE subject_id subject_id INT NOT NULL');
        $this->addSql('ALTER TABLE test ADD CONSTRAINT FK_D87F7E0C208F64F1 FOREIGN KEY (tutor_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_D87F7E0C208F64F1 ON test (tutor_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE test DROP FOREIGN KEY FK_D87F7E0C208F64F1');
        $this->addSql('DROP INDEX IDX_D87F7E0C208F64F1 ON test');
        $this->addSql('ALTER TABLE test DROP tutor_id, CHANGE subject_id subject_id INT DEFAULT NULL');
    }
}
